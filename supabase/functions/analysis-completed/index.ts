import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const reportId = body.report_id as string | undefined;
    const n8nUserId = body.n8n_user_id as string | undefined;

    if (!reportId) {
      return new Response(JSON.stringify({ error: 'report_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY') ?? ''
    );

    // Update report status and optional n8n_user_id
    const updatePayload: Record<string, unknown> = { status: 'completed' };
    if (n8nUserId) updatePayload.n8n_user_id = n8nUserId;

    const { data: updated, error: updateError } = await supabase
      .from('reports')
      .update(updatePayload)
      .eq('id', reportId)
      .select('id, user_id, title')
      .single();

    if (updateError) {
      console.error('Failed to update report status:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update report status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', updated.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error('Failed to fetch profile/email:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to fetch recipient email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send report-ready email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set; skipping email');
      return new Response(JSON.stringify({ success: true, email_skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(resendApiKey);
    const dashboardUrl = `https://atlas-assessments.com/dashboard`;

    const firstName = profile.first_name || 'there';
    const subject = 'Your Atlas career report is ready';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #4361ee;">Your report is ready, ${firstName}!</h2>
        <p>Your career report${updated.title ? ` "${updated.title}"` : ''} is now available.</p>
        <p>
          <a href="${dashboardUrl}" style="background:#4361ee;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">View your report</a>
        </p>
        ${n8nUserId ? `<p style="color:#666">Chat session ID: ${n8nUserId}</p>` : ''}
        <p style="color:#888;font-size:12px;margin-top:24px;">If you did not request this, you can ignore this email.</p>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'Atlas Assessment <no-reply@atlas-assessments.com>',
      to: [profile.email],
      subject,
      html,
    });

    if (emailError) {
      console.error('Failed to send report-ready email:', emailError);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analysis-completed function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

 