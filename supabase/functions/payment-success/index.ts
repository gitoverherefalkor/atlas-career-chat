
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders, handleCorsPreFlight, errorResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Function to generate a cryptographically secure access code
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters
  const totalChars = 16; // 4 groups of 4
  const randomBytes = new Uint8Array(totalChars);
  crypto.getRandomValues(randomBytes);

  let code = "";
  for (let i = 0; i < totalChars; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(randomBytes[i] % chars.length);
  }
  return code;
}

// Function to send the access code email
async function sendAccessCodeEmail(email: string, firstName: string, lastName: string, accessCode: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Cairnly <no-reply@cairnly.io>",
      to: [email],
      subject: "Your Cairnly Access Code",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background-color: #27A1A1; height: 4px; font-size: 0; line-height: 0;">&nbsp;</div>
          <div style="background-color: #213F4F; padding: 32px 40px 28px; text-align: center;">
            <img src="https://cairnly.io/cairnly-logo-white.png" alt="Cairnly" width="180" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
            <p style="color: #27A1A1; margin: 12px 0 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">Career Discovery Platform</p>
          </div>

          <div style="padding: 40px; color: #333333;">
            <h2 style="color: #213F4F; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Your Purchase was Successful!</h2>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px; color: #444;">
              Hello ${firstName} ${lastName},
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #444;">
              Thank you for purchasing Cairnly. You can continue right where you left off, your assessment is ready on the platform.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px; color: #444;">
              <strong>Keep this access code safe.</strong> It's your backup, use it to log back in any time and pick up your assessment.
            </p>

            <div style="background-color: #213F4F; padding: 20px; border-radius: 8px; text-align: center; margin: 16px 0 24px 0;">
              <span style="color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                ${accessCode}
              </span>
            </div>

            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0; color: #444;">
              Need to get back to your assessment? Head to your
              <a href="https://cairnly.io/dashboard" style="color: #3989AF; text-decoration: none; font-weight: 500;">dashboard</a>,
              you can start a new assessment or continue an existing one from there.
            </p>

            <p style="font-size: 14px; color: #888; margin-top: 24px;">
              Your access code is valid for one year from today. If you have any questions, please contact our support team.
            </p>
          </div>

          <div style="text-align: center; padding: 24px 40px; border-top: 1px solid #e8e8e8; background-color: #f8f9fa;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              &copy; 2026 Cairnly. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Email sending error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  const preflight = handleCorsPreFlight(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);

  try {
    // --- Stripe webhook signature verification ---
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let session: Stripe.Checkout.Session;

    if (stripeWebhookSecret && req.headers.get("stripe-signature")) {
      // Webhook mode: verify signature from Stripe
      const body = await req.text();
      const sig = req.headers.get("stripe-signature")!;

      try {
        const event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret);
        if (event.type !== "checkout.session.completed") {
          return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        session = event.data.object as Stripe.Checkout.Session;
      } catch (err) {
        console.error("Stripe webhook signature verification failed:", err);
        return errorResponse("Invalid webhook signature", 400, corsHeaders);
      }
    } else {
      // Fallback: frontend calls with sessionId (existing flow)
      const { sessionId } = await req.json();

      if (!sessionId) {
        return errorResponse("Session ID is required", 400, corsHeaders);
      }

      // Retrieve session from Stripe
      session = await stripe.checkout.sessions.retrieve(sessionId);
    }

    if (session.payment_status !== "paid") {
      return errorResponse("Payment is not complete", 400, corsHeaders);
    }

    // Create a Supabase client (using service role key to bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('NEW_N8N_SERVICE_ROLE_KEY')!
    );

    // Idempotency: if a purchase row already exists for this Stripe session,
    // return the previously-minted access code rather than minting a new one.
    // Without this guard, Stripe webhook retries or duplicate success-page
    // calls would mint duplicate codes and re-email the customer.
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("access_code_id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existingPurchase?.access_code_id) {
      const { data: existingCode } = await supabase
        .from("access_codes")
        .select("code")
        .eq("id", existingPurchase.access_code_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          accessCode: existingCode?.code ?? null,
          alreadyProcessed: true,
          message: "Payment already processed",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate a new access code
    const accessCode = generateAccessCode();

    // Calculate expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Extract pricing information from session
    const amountTotal = session.amount_total ? session.amount_total / 100 : 39;
    const currency = session.currency?.toUpperCase() || 'EUR';

    // Store the access code in the database with pricing info
    const { data: codeData, error: codeError } = await supabase
      .from("access_codes")
      .insert({
        code: accessCode,
        expires_at: expiresAt.toISOString(),
        price_paid: amountTotal,
        currency: currency,
        survey_type: 'Office / Business Pro - 2025 v1 EN'
      })
      .select("id")
      .single();

    if (codeError) {
      console.error("Error creating access code:", codeError);
      return errorResponse("Failed to process payment. Please contact support.", 500, corsHeaders);
    }

    // Extract customer information from session metadata
    const customerEmail = session.customer_details?.email;
    const firstName = session.metadata?.firstName || "Customer";
    const lastName = session.metadata?.lastName || "";
    const country = session.metadata?.country || "Unknown";

    // Store the purchase details. Race-safe: if another concurrent call won
    // the insert, the UNIQUE constraint on stripe_session_id throws and we
    // fall back to the existing code (whoever inserted wins).
    const { error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        email: customerEmail,
        first_name: firstName,
        last_name: lastName,
        country: country,
        stripe_session_id: session.id,
        access_code_id: codeData.id,
      });

    if (purchaseError) {
      // 23505 = unique_violation — another concurrent call beat us to it.
      // Roll back our orphaned access_codes row and return the winner's code.
      if (purchaseError.code === '23505') {
        console.warn(`Race detected on stripe_session_id=${session.id}, falling back to existing code`);
        await supabase.from("access_codes").delete().eq("id", codeData.id);

        const { data: winnerPurchase } = await supabase
          .from("purchases")
          .select("access_code_id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();
        const { data: winnerCode } = winnerPurchase?.access_code_id
          ? await supabase.from("access_codes").select("code").eq("id", winnerPurchase.access_code_id).maybeSingle()
          : { data: null };

        return new Response(
          JSON.stringify({
            success: true,
            accessCode: winnerCode?.code ?? null,
            alreadyProcessed: true,
            message: "Payment already processed",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("Error recording purchase:", purchaseError);
      return errorResponse("Failed to record purchase. Please contact support.", 500, corsHeaders);
    }

    // Try to update the profile if user exists with this email
    if (customerEmail) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      if (existingProfile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            country: country,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingProfile.id);

        if (profileError) {
          console.warn("Could not update profile:", profileError);
        }
      }
    }

    // Send the access code via email
    if (customerEmail) {
      const emailSent = await sendAccessCodeEmail(customerEmail, firstName, lastName, accessCode);
      if (!emailSent) {
        console.warn("Warning: Email could not be sent, but purchase was successful");
      }
    }

    // Return access code and purchase data to the frontend for display and auth pre-fill.
    // This is the same HTTPS session that processed the payment — the user owns this data.
    return new Response(
      JSON.stringify({
        success: true,
        accessCode: accessCode,
        purchaseData: {
          email: customerEmail,
          firstName: firstName,
          lastName: lastName
        },
        message: "Payment processed successfully"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return errorResponse("An error occurred processing your payment. Please contact support.", 500, corsHeaders);
  }
});
