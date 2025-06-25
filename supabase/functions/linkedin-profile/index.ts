
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT token and get user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      throw new Error('Invalid token')
    }

    console.log('User ID:', user.id)

    let linkedinToken = null

    // Get user with admin privileges to access all data
    const { data: adminUserData, error: adminError } = await supabaseClient.auth.admin.getUserById(user.id)
    
    if (adminError) {
      console.error('Admin user fetch error:', adminError)
      throw new Error('Failed to retrieve user data')
    }

    console.log('Admin user data received')
    
    // Log the structure to understand where tokens are stored
    console.log('User metadata:', JSON.stringify(adminUserData.user?.user_metadata, null, 2))
    console.log('App metadata:', JSON.stringify(adminUserData.user?.app_metadata, null, 2))
    console.log('Identities count:', adminUserData.user?.identities?.length || 0)
    
    // Check identities for LinkedIn provider
    if (adminUserData.user?.identities) {
      for (const identity of adminUserData.user.identities) {
        console.log(`Identity provider: ${identity.provider}`)
        console.log(`Identity data keys: ${Object.keys(identity.identity_data || {})}`)
        
        if (identity.provider === 'linkedin_oidc' || identity.provider === 'linkedin') {
          console.log('Found LinkedIn identity:', JSON.stringify(identity, null, 2))
          
          // Try different possible locations for the token
          linkedinToken = 
            identity.identity_data?.provider_token ||
            identity.identity_data?.access_token ||
            identity.provider_token ||
            null
            
          if (linkedinToken) {
            console.log('LinkedIn token found in identity data')
            break
          }
        }
      }
    }

    // Method 2: Check if token is in user metadata
    if (!linkedinToken && adminUserData.user) {
      linkedinToken = 
        adminUserData.user.user_metadata?.provider_token ||
        adminUserData.user.app_metadata?.provider_token ||
        null
        
      if (linkedinToken) {
        console.log('LinkedIn token found in user metadata')
      }
    }

    if (!linkedinToken) {
      console.error('No LinkedIn token found in any location')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'LinkedIn not connected or token expired',
          debug: {
            hasUser: !!adminUserData.user,
            identitiesCount: adminUserData.user?.identities?.length || 0,
            providers: adminUserData.user?.identities?.map(i => i.provider) || []
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Making LinkedIn API request with token')

    // Make request to LinkedIn API
    const linkedinResponse = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${linkedinToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    })

    console.log('LinkedIn API response status:', linkedinResponse.status)

    if (!linkedinResponse.ok) {
      const errorText = await linkedinResponse.text()
      console.error('LinkedIn API error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'LinkedIn API error',
          status: linkedinResponse.status,
          details: errorText
        }),
        {
          status: linkedinResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const profileData = await linkedinResponse.json()
    console.log('LinkedIn profile data received')

    return new Response(
      JSON.stringify({ 
        success: true,
        data: profileData,
        tokenSource: 'Successfully retrieved'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Function error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
