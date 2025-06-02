
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Forward to Relevance function called');
    
    // Get the request body
    const requestBody = await req.json();
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));
    
    // Extract the payload from the request body
    const surveyData = requestBody.payload || requestBody;
    console.log('Survey data to send:', JSON.stringify(surveyData, null, 2));

    if (!surveyData) {
      console.error('No survey data found in request');
      return new Response(JSON.stringify({ error: 'No survey data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Step 1: Create a report record first
    console.log('Creating report record...');
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: requestBody.user_id || null,
        title: 'Career Assessment Report',
        status: 'processing',
        payload: surveyData,
        access_code_id: requestBody.access_code_id || null,
        survey_id: requestBody.survey_id || null
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      return new Response(JSON.stringify({ error: 'Failed to create report record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Report created with ID:', reportData.id);

    // Step 2: Build the Relevance AI request body with report_id as input variable
    const body = {
      message: { 
        role: "user", 
        content: JSON.stringify(surveyData) 
      },
      agent_id: Deno.env.get("RELEVANCE_AGENT_ID"),
      inputs: {
        report_id: reportData.id,
        survey_data: surveyData
      }
    };

    console.log('Sending to Relevance AI with agent_id:', Deno.env.get("RELEVANCE_AGENT_ID"));
    console.log('Complete request body being sent to Relevance:', JSON.stringify(body, null, 2));
    console.log('Report ID being sent as input:', reportData.id);

    // POST to Relevance AI
    const resp = await fetch(
      "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Deno.env.get("RELEVANCE_API_KEY")!,
        },
        body: JSON.stringify(body),
      },
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Relevance AI error:", resp.status, err);
      
      // Update report status to failed
      await supabase
        .from('reports')
        .update({ status: 'failed' })
        .eq('id', reportData.id);
      
      return new Response(`Upstream error: ${resp.status} ${err}`, { 
        status: 502,
        headers: corsHeaders 
      });
    }

    const result = await resp.json();
    console.log('Relevance AI response:', result);

    // Update report status to completed
    await supabase
      .from('reports')
      .update({ status: 'completed' })
      .eq('id', reportData.id);

    // Step 3: Send email notification when report is ready
    try {
      // Get user email from the user_id
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, first_name')
        .eq('id', requestBody.user_id)
        .single();

      if (userError || !userData?.email) {
        console.error('Error fetching user email:', userError);
        // Don't fail the whole process if email fails
      } else {
        console.log('Sending email notification to:', userData.email);
        
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
        
        // Generate a secure access token for the chat
        const chatAccessToken = crypto.randomUUID();
        
        // Store the chat access token in the database
        await supabase
          .from('reports')
          .update({ 
            status: 'completed',
            chat_access_token: chatAccessToken 
          })
          .eq('id', reportData.id);

        const chatUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app/chat?token=${chatAccessToken}`;
        
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "Atlas Assessment <no-reply@atlas-assessments.com>",
          to: [userData.email],
          subject: "Your Atlas Career Assessment Results Are Ready! 🎯",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e3a8a; margin-bottom: 10px;">Your Career Assessment is Complete!</h1>
                <p style="font-size: 18px; color: #666;">Ready to discover your personalized career insights?</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #1e3a8a; margin-top: 0;">Hello ${userData.first_name || 'there'}! 👋</h2>
                <p style="margin-bottom: 20px;">Great news! We've completed the analysis of your Atlas Career Assessment and your personalized report is ready.</p>
                
                <p style="margin-bottom: 20px;">Your report includes:</p>
                <ul style="margin-left: 20px; margin-bottom: 20px;">
                  <li>🎯 Your unique career strengths and values</li>
                  <li>💼 Personalized career recommendations</li>
                  <li>🔄 Work environment preferences</li>
                  <li>📈 Professional development insights</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${chatUrl}" 
                     style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    🚀 Access Your Results & Chat with AI Coach
                  </a>
                </div>
                
                <p style="margin-bottom: 15px;"><strong>What happens next?</strong></p>
                <p style="margin-bottom: 20px;">Click the button above to access your personalized career chat where you can:</p>
                <ul style="margin-left: 20px; margin-bottom: 20px;">
                  <li>Review your detailed assessment results</li>
                  <li>Ask questions about your career path</li>
                  <li>Get specific advice from our AI career coach</li>
                  <li>Explore career opportunities tailored to you</li>
                </ul>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>💡 Pro Tip:</strong> For the best experience, access your results on a computer or tablet rather than a mobile device.</p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                <p>This link is unique to you and will remain active for 30 days.</p>
                <p>Questions? Reply to this email and we'll help you out!</p>
                <p style="margin-top: 20px;">
                  <strong>Atlas Career Assessment</strong><br>
                  Your partner in professional growth
                </p>
              </div>
            </div>
          `,
        });

        if (emailError) {
          console.error('Failed to send email notification:', emailError);
        } else {
          console.log('Email notification sent successfully:', emailData);
        }
      }
    } catch (emailErr) {
      console.error('Error in email notification process:', emailErr);
      // Don't fail the whole process if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      report_id: reportData.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in forward-to-relevance function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
