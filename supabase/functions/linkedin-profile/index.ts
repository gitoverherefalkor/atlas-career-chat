
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user's session from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header provided')
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Get user data to verify authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User authentication error:', userError)
      throw new Error('Invalid user session')
    }

    console.log('User authenticated, checking for LinkedIn token...')

    // Try to get the session with provider token using the service role key
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.getUserById(user.id)
    
    if (sessionError) {
      console.error('Error getting user session:', sessionError)
      throw new Error('Failed to retrieve user session')
    }

    console.log('User identities:', JSON.stringify(sessionData.user?.identities, null, 2))

    // Look for LinkedIn identity and extract token
    const linkedinIdentity = sessionData.user?.identities?.find(
      identity => identity.provider === 'linkedin_oidc'
    )

    if (!linkedinIdentity || !linkedinIdentity.identity_data?.provider_token) {
      console.error('No LinkedIn token found in identities')
      throw new Error('No LinkedIn access token found. Please reconnect to LinkedIn.')
    }

    const linkedinToken = linkedinIdentity.identity_data.provider_token
    console.log('Found LinkedIn token, making API call...')

    // Make the LinkedIn API call
    const linkedinResponse = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${linkedinToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!linkedinResponse.ok) {
      console.error('LinkedIn API error:', linkedinResponse.status, linkedinResponse.statusText)
      const errorText = await linkedinResponse.text()
      console.error('LinkedIn API error body:', errorText)
      
      if (linkedinResponse.status === 401) {
        throw new Error('LinkedIn access token is invalid or expired. Please reconnect.')
      }
      throw new Error(`LinkedIn API error: ${linkedinResponse.status} ${linkedinResponse.statusText}`)
    }

    const profileData = await linkedinResponse.json()
    console.log('Successfully retrieved LinkedIn profile data')
    
    return new Response(JSON.stringify({
      success: true,
      data: profileData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('LinkedIn profile error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
