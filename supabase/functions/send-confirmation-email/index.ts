
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
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #012F64; padding: 30px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 0.5px;">Atlas Assessment</h1>
            <p style="color: #27A1A1; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Career Discovery Platform</p>
          </div>

          <div style="padding: 40px; color: #333333;">
            <h2 style="color: #012F64; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Password Reset Request</h2>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #444;">
              Hi ${firstName},
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 28px; color: #444;">
              We received a request to reset your Atlas Assessment password. Click the button below to create a new password:
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmationUrl}"
                 style="background-color: #27A1A1; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                Reset Your Password
              </a>
            </div>

            <p style="font-size: 13px; color: #888; margin-top: 28px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 13px; color: #3989AF; word-break: break-all; background-color: #f0f7fa; padding: 12px; border-radius: 4px;">
              ${confirmationUrl}
            </p>
          </div>

          <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e8e8e8; background-color: #f8f9fa;">
            <p style="color: #999; font-size: 12px; margin: 4px 0;">
              This password reset link will expire in 24 hours for security reasons.
            </p>
            <p style="color: #999; font-size: 12px; margin: 4px 0;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin: 16px 0 0 0;">
              &copy; 2026 Atlas Assessment. All rights reserved.
            </p>
          </div>
        </div>
      ` : `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #012F64; padding: 30px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 0.5px;">Atlas Assessment</h1>
            <p style="color: #27A1A1; margin: 8px 0 0 0; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Career Discovery Platform</p>
          </div>

          <div style="padding: 40px; color: #333333;">
            <h2 style="color: #012F64; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Welcome to Atlas Assessment, ${firstName}!</h2>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #444;">
              Thank you for creating your account. You're just one step away from starting your personalized career discovery journey.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 28px; color: #444;">
              Please confirm your email address by clicking the button below:
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmationUrl}"
                 style="background-color: #27A1A1; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                Confirm Your Email Address
              </a>
            </div>

            <p style="font-size: 13px; color: #888; margin-top: 28px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="font-size: 13px; color: #3989AF; word-break: break-all; background-color: #f0f7fa; padding: 12px; border-radius: 4px;">
              ${confirmationUrl}
            </p>
          </div>

          <div style="padding: 24px 40px; background-color: #f0f7fa; border-left: 4px solid #27A1A1;">
            <h3 style="color: #012F64; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">What's Next?</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Confirm your email address</li>
              <li>Complete your personalized career assessment</li>
              <li>Receive your detailed career insights report</li>
              <li>Discover career opportunities aligned with your strengths</li>
            </ul>
          </div>

          <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e8e8e8; background-color: #f8f9fa;">
            <p style="color: #999; font-size: 12px; margin: 4px 0;">
              This confirmation link will expire in 24 hours for security reasons.
            </p>
            <p style="color: #999; font-size: 12px; margin: 4px 0;">
              If you didn't create an Atlas Assessment account, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin: 16px 0 0 0;">
              &copy; 2026 Atlas Assessment. All rights reserved.
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
