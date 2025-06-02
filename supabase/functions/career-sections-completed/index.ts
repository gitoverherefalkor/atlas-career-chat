
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
    console.log('Career sections completed webhook called');
    
    // Get the request body
    const requestBody = await req.json();
    console.log('Webhook payload:', JSON.stringify(requestBody, null, 2));
    
    // Extract values from the payload
    const { sections } = requestBody;
    let { relevance_user_id: relevanceUserId, report_id: reportId } = requestBody;
    
    // Handle case where report_id comes as {answer: "uuid"}
    if (reportId && typeof reportId === 'object' && reportId.answer) {
      reportId = reportId.answer;
    }

    console.log('Extracted values:', { relevanceUserId, reportId, sectionsCount: sections?.length });

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

    // Store the sections in the report_sections table if provided
    if (sections && Array.isArray(sections)) {
      console.log('Storing report sections...');
      for (const section of sections) {
        if (section.section_type && section.content) {
          await supabase
            .from('report_sections')
            .insert({
              report_id: reportId,
              section_type: section.section_type,
              content: section.content
            });
        }
      }
    }

    // Update report status to final report ready
    console.log('Updating report with final sections for ID:', reportId);
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .update({ status: 'final_report_ready' })
      .eq('id', reportId)
      .select('*, profiles(email, first_name)')
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

    console.log('Report updated successfully for final sections:', reportData.id);

    // Send final report ready email notification
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      const dashboardUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app/dashboard`;
      
      const userEmail = reportData.profiles?.email || reportData.user_id;
      const firstName = reportData.profiles?.first_name || 'there';

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Atlas Assessment <no-reply@atlas-assessments.com>",
        to: [userEmail],
        subject: "Your Complete Atlas Career Report is Ready! 📊",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e3a8a; margin-bottom: 10px;">Your Complete Career Report is Ready!</h1>
              <p style="font-size: 18px; color: #666;">Your comprehensive career assessment results are now available</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Hello ${firstName}! 🎉</h2>
              <p style="margin-bottom: 20px;">Excellent news! Your complete Atlas Career Assessment report is now ready for viewing in your dashboard.</p>
              
              <p style="margin-bottom: 20px;">Your final report includes:</p>
              <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>📊 Complete personality analysis</li>
                <li>💪 Your top strengths and growth areas</li>
                <li>🎯 Personalized career recommendations</li>
                <li>🚀 Specific next steps for your career journey</li>
                <li>💼 Detailed role suggestions tailored to you</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" 
                   style="background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  📊 View Your Complete Report
                </a>
              </div>
            </div>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #0c4a6e;"><strong>💡 Remember:</strong> You can still chat with your AI career coach using your access code: <strong>${relevanceUserId}</strong></p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
              <p>Thank you for choosing Atlas Career Assessment!</p>
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
        console.error('Failed to send final report email:', emailError);
      } else {
        console.log('Final report email sent successfully:', emailData);
      }
    } catch (emailErr) {
      console.error('Error in final report email process:', emailErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Career sections completed notification processed',
      report_id: reportData.id,
      relevance_user_id: relevanceUserId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in career-sections-completed webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
