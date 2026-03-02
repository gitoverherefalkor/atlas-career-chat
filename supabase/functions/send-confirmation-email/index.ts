
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders, handleCorsPreFlight, errorResponse } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, corsHeaders);
  }

  try {
    const payload = await req.text();

    // Parse the payload - it could be from the webhook or direct call
    let webhookData;
    try {
      webhookData = JSON.parse(payload);
    } catch (e) {
      console.error("Failed to parse payload as JSON:", e);
      return errorResponse("Invalid JSON payload", 400, corsHeaders);
    }

    // Handle different payload structures
    let user, emailData;

    if (webhookData.user) {
      user = webhookData.user;
      emailData = webhookData.email_data;
    } else if (webhookData.record) {
      user = webhookData.record;
      emailData = webhookData.email_data;
    } else {
      user = webhookData;
      emailData = webhookData.email_data || {};
    }

    if (!user || !user.email) {
      console.error("No user email found in payload");
      return errorResponse("No user email found", 400, corsHeaders);
    }

    const firstName = user.user_metadata?.first_name || user.raw_user_meta_data?.first_name || "there";

    // Build confirmation URL - handle different possible token formats
    let confirmationUrl;
    const emailActionType = emailData?.email_action_type || 'signup';

    if (emailData && emailData.token_hash) {
      const redirectTo = emailData.redirect_to || "https://atlas-assessments.com/dashboard";

      // Extract the origin from redirect_to to determine the correct base URL
      let baseUrl;
      try {
        const redirectUrl = new URL(redirectTo);
        baseUrl = redirectUrl.origin;
      } catch {
        baseUrl = "https://atlas-assessments.com";
      }

      confirmationUrl = `${baseUrl}/auth/confirm?token=${emailData.token_hash}&type=${emailActionType}&redirect_to=${encodeURIComponent(redirectTo)}`;
    } else {
      confirmationUrl = "https://atlas-assessments.com/auth";
    }

    // Check if this is a password reset email
    const isPasswordReset = emailActionType === 'recovery';

    const { data, error } = await resend.emails.send({
      from: "Atlas Assessment <no-reply@atlas-assessments.com>",
      to: [user.email],
      subject: isPasswordReset ? "Reset Your Atlas Assessment Password" : "Confirm Your Atlas Assessment Account",
      html: isPasswordReset ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4361ee; margin: 0; font-size: 28px;">Atlas Assessment</h1>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Career Discovery Platform</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #4361ee;">
            <h2 style="color: #4361ee; margin-bottom: 20px; font-size: 24px;">Password Reset Request</h2>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi ${firstName},
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your Atlas Assessment password. Click the button below to create a new password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}"
                 style="background-color: #4361ee; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
                Reset Your Password
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 25px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #4361ee; word-break: break-all; background-color: #edf2ff; padding: 10px; border-radius: 4px;">
              ${confirmationUrl}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 5px 0;">
              This password reset link will expire in 24 hours for security reasons.
            </p>
            <p style="color: #888; font-size: 12px; margin: 5px 0;">
              If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
            </p>
            <p style="color: #888; font-size: 12px; margin: 15px 0 0 0;">
              &copy; 2025 Atlas Assessment. All rights reserved.
            </p>
          </div>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4361ee; margin: 0; font-size: 28px;">Atlas Assessment</h1>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Career Discovery Platform</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #4361ee;">
            <h2 style="color: #4361ee; margin-bottom: 20px; font-size: 24px;">Welcome to Atlas Assessment, ${firstName}!</h2>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for creating your Atlas Assessment account. You're just one step away from starting your personalized career discovery journey.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Please confirm your email address by clicking the button below:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}"
                 style="background-color: #4361ee; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
                Confirm Your Email Address
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 25px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #4361ee; word-break: break-all; background-color: #edf2ff; padding: 10px; border-radius: 4px;">
              ${confirmationUrl}
            </p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #edf2ff; border-radius: 8px;">
            <h3 style="color: #4361ee; margin-bottom: 15px; font-size: 18px;">What's Next?</h3>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Confirm your email address</li>
              <li>Complete your personalized career assessment</li>
              <li>Receive your detailed career insights report</li>
              <li>Discover new career opportunities aligned with your strengths</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px; margin: 5px 0;">
              This confirmation link will expire in 24 hours for security reasons.
            </p>
            <p style="color: #888; font-size: 12px; margin: 5px 0;">
              If you didn't create an Atlas Assessment account, you can safely ignore this email.
            </p>
            <p style="color: #888; font-size: 12px; margin: 15px 0 0 0;">
              &copy; 2025 Atlas Assessment. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Email sending error:", error);
      return errorResponse("Failed to send confirmation email", 500, corsHeaders);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-confirmation-email function:", error);
    return errorResponse("Failed to send email. Please try again.", 500, corsHeaders);
  }
});
