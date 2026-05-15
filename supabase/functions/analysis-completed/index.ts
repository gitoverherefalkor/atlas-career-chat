import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";
import { verifySharedSecret, errorResponse } from "../_shared/cors.ts";

// n8n-called function — no browser CORS needed
const serverHeaders = { 'Content-Type': 'application/json' };

serve(async (req) => {
  // No CORS preflight needed — this is server-to-server only
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  // Verify shared secret from n8n
  const authError = verifySharedSecret(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const reportId = body.report_id as string | undefined;

    if (!reportId) {
      return errorResponse('report_id is required', 400, serverHeaders);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY') ?? ''
    );

    // Update report status to pending_review (ready for user chat)
    const { data: updated, error: updateError } = await supabase
      .from('reports')
      .update({ status: 'pending_review' })
      .eq('id', reportId)
      .select('id, user_id, title')
      .single();

    if (updateError) {
      console.error('Failed to update report status:', updateError);
      return errorResponse('Failed to update report status', 500, serverHeaders);
    }

    // Fetch user email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', updated.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error('Failed to fetch profile/email:', profileError);
      return errorResponse('Failed to fetch recipient email', 500, serverHeaders);
    }

    // Send report-ready email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set; skipping email');
      return new Response(JSON.stringify({ success: true, email_skipped: true }), {
        headers: serverHeaders,
      });
    }

    const resend = new Resend(resendApiKey);
    const chatUrl = `https://cairnly.io/chat`;

    const firstName = profile.first_name || 'there';
    const subject = 'Your Cairnly career report is ready';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #27A1A1; height: 4px; font-size: 0; line-height: 0;">&nbsp;</div>
        <div style="background-color: #213F4F; padding: 32px 40px 28px; text-align: center;">
          <img src="https://cairnly.io/cairnly-logo-white.png" alt="Cairnly" width="180" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
          <p style="color: #27A1A1; margin: 12px 0 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">Career Discovery Platform</p>
        </div>

        <div style="padding: 40px; color: #333333;">
          <h2 style="color: #213F4F; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Your career analysis is ready, ${firstName}</h2>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #444;">
            Your assessment${updated.title ? ` "${updated.title}"` : ''} has been analyzed and your AI career coach is ready to walk you through the results.
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #444;">
            The coaching chat is the core of the Cairnly experience. It covers your personality profile, strengths, career matches, and dream job analysis, section by section, with you in the driver's seat.
          </p>

          <div style="background-color: #f0f7fa; border-left: 4px solid #27A1A1; padding: 16px 20px; margin-bottom: 28px; border-radius: 0 8px 8px 0;">
            <p style="color: #213F4F; font-weight: 600; margin: 0 0 4px 0; font-size: 15px;">Typically takes 20-30 minutes</p>
            <p style="color: #666; font-size: 14px; margin: 0;">Your session is saved if you need to pause and come back.</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${chatUrl}"
               style="background-color: #27A1A1; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
              Start Your Coaching Session
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e8e8e8; background-color: #f8f9fa;">
          <p style="color: #999; font-size: 12px; margin: 4px 0;">
            If you did not request this, you can ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin: 16px 0 0 0;">
            &copy; 2026 Cairnly. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'Cairnly <no-reply@cairnly.io>',
      to: [profile.email],
      subject,
      html,
    });

    if (emailError) {
      console.error('Failed to send report-ready email:', emailError);
      return errorResponse('Failed to send email', 500, serverHeaders);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: serverHeaders,
    });
  } catch (error) {
    console.error('Error in analysis-completed function:', error);
    return errorResponse('Internal server error', 500, serverHeaders);
  }
});
