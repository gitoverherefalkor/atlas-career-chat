
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
    
    // Get user session to access provider token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user session')
    }

    // Get the session to access provider token
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    
    if (sessionError || !session) {
      // Try to get session from user metadata or app metadata
      const linkedinToken = user.app_metadata?.provider_token || user.user_metadata?.provider_token
      
      if (!linkedinToken) {
        throw new Error('No LinkedIn access token found. Please reconnect to LinkedIn.')
      }

      // Make the LinkedIn API call
      const linkedinResponse = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${linkedinToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!linkedinResponse.ok) {
        if (linkedinResponse.status === 401) {
          throw new Error('LinkedIn access token is invalid or expired. Please reconnect.')
        }
        throw new Error(`LinkedIn API error: ${linkedinResponse.status} ${linkedinResponse.statusText}`)
      }

      const profileData = await linkedinResponse.json()
      
      return new Response(JSON.stringify({
        success: true,
        data: profileData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const linkedinToken = session.provider_token
    
    if (!linkedinToken) {
      throw new Error('No LinkedIn access token found. Please reconnect to LinkedIn.')
    }

    console.log('Making LinkedIn API call with token')
    
    // Make the LinkedIn API call
    const linkedinResponse = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${linkedinToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!linkedinResponse.ok) {
      if (linkedinResponse.status === 401) {
        throw new Error('LinkedIn access token is invalid or expired. Please reconnect.')
      }
      throw new Error(`LinkedIn API error: ${linkedinResponse.status} ${linkedinResponse.statusText}`)
    }

    const profileData = await linkedinResponse.json()
    
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
