
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Function called with method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    console.log("Received payload:", payload);
    
    const headers = Object.fromEntries(req.headers);
    console.log("Headers:", headers);
    
    const wh = new Webhook(hookSecret);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
        user_metadata?: {
          first_name?: string;
          last_name?: string;
        };
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    console.log("Webhook verified successfully for user:", user.email);

    const firstName = user.user_metadata?.first_name || "there";
    const confirmationUrl = `https://atlas-assessments.com/auth/confirm?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent("https://atlas-assessments.com/")}`;

    console.log("Sending confirmation email to:", user.email);

    const { data, error } = await resend.emails.send({
      from: "Atlas Assessment <no-reply@atlas-assessments.com>",
      to: [user.email],
      subject: "Confirm Your Atlas Assessment Account",
      html: `
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
              © 2025 Atlas Assessment. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Email sending error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Confirmation email sent successfully:", data);
    
    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
