
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
    console.log('Analysis completed webhook called');
    
    // Get the request body
    const requestBody = await req.json();
    console.log('Webhook payload:', JSON.stringify(requestBody, null, 2));
    
    // Extract values - handle both direct string and object formats
    const relevanceUserId = requestBody.relevance_user_id || requestBody.user_id;
    let reportId = requestBody.report_id;
    
    // Handle case where report_id comes as {answer: "uuid"}
    if (reportId && typeof reportId === 'object' && reportId.answer) {
      reportId = reportId.answer;
    }

    console.log('Extracted values:', { relevanceUserId, reportId });

    if (!relevanceUserId || !reportId) {
      console.error('Missing required fields:', { relevanceUserId, reportId });
      return new Response(JSON.stringify({ error: 'Missing relevance_user_id or report_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Find and update the report with the Relevance user ID
    console.log('Updating report with ID:', reportId);
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .update({ 
        relevance_user_id: relevanceUserId,
        status: 'chat_ready'
      })
      .eq('id', reportId)
      .select()
      .single();

    if (reportError) {
      console.error('Error updating report:', reportError);
      return new Response(JSON.stringify({ error: 'Failed to update report' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!reportData) {
      console.error('Report not found with ID:', reportId);
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Report updated successfully:', reportData.id);

    // Get user profile for email if user_id exists
    let userEmail = reportData.user_id; // fallback to user_id
    let firstName = 'there';

    if (reportData.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, first_name')
        .eq('id', reportData.user_id)
        .single();
      
      if (profileData) {
        userEmail = profileData.email;
        firstName = profileData.first_name || 'there';
      }
    }

    // Send email notification
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      // Generate a secure access token for the chat
      const chatAccessToken = crypto.randomUUID();
      
      // Store the chat access token in the database
      await supabase
        .from('reports')
        .update({ chat_access_token: chatAccessToken })
        .eq('id', reportData.id);

      const chatUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app/chat?token=${chatAccessToken}&user_id=${relevanceUserId}`;

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Atlas Assessment <no-reply@atlas-assessments.com>",
        to: [userEmail],
        subject: "Your Atlas Career Assessment Analysis is Ready! 🚀",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e3a8a; margin-bottom: 10px;">Your Career Analysis is Complete!</h1>
              <p style="font-size: 18px; color: #666;">Ready to explore your personalized career insights?</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Hello ${firstName}! 👋</h2>
              <p style="margin-bottom: 20px;">Exciting news! We've completed the analysis of your Atlas Career Assessment and your personalized AI career coach is now ready to chat with you.</p>
              
              <p style="margin-bottom: 20px;"><strong>Your unique access code:</strong></p>
              <div style="background: #fff; border: 2px solid #10b981; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <code style="font-size: 18px; font-weight: bold; color: #1e3a8a; letter-spacing: 1px;">${relevanceUserId}</code>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${chatUrl}" 
                   style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  🤖 Start Chatting with Your AI Career Coach
                </a>
              </div>
              
              <p style="margin-bottom: 15px;"><strong>What can you do now?</strong></p>
              <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>Ask questions about your career assessment results</li>
                <li>Get personalized career recommendations</li>
                <li>Explore your strengths and growth areas</li>
                <li>Discuss specific career paths and opportunities</li>
                <li>Receive guidance on professional development</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>💡 Pro Tip:</strong> Save your access code (${relevanceUserId}) - you'll need it to continue conversations with your AI coach.</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
              <p>This is just the beginning of your career journey with Atlas!</p>
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
    } catch (emailErr) {
      console.error('Error in email notification process:', emailErr);
      // Don't fail the whole process if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Analysis completed notification processed',
      report_id: reportData.id,
      relevance_user_id: relevanceUserId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analysis-completed webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
