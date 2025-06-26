
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to generate a random access code
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters
  let code = "";
  
  // Generate 4 groups of 4 characters
  for (let group = 0; group < 4; group++) {
    if (group > 0) code += "-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return code;
}

// Function to send the access code email
async function sendAccessCodeEmail(email: string, firstName: string, lastName: string, accessCode: string) {
  try {
    console.log("Attempting to send email to:", email);
    const { data, error } = await resend.emails.send({
      from: "Atlas Assessment <no-reply@atlas-assessments.com>",
      to: [email],
      subject: "Your Atlas Assessment Access Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4361ee;">Atlas Assessment</h1>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <h2 style="color: #4361ee; margin-bottom: 20px;">Your Purchase was Successful!</h2>
            <p>Hello ${firstName} ${lastName},</p>
            <p>Thank you for purchasing the Atlas Assessment. Your access code is:</p>
            <div style="background-color: #edf2ff; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">
              ${accessCode}
            </div>
            <p>To use your access code:</p>
            <ol>
              <li>Visit <a href="https://atlas-assessments.com/assessment" style="color: #4361ee; text-decoration: none;">atlas-assessments.com/assessment</a></li>
              <li>Enter your access code when prompted</li>
              <li>Complete your personalized career assessment</li>
            </ol>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://atlas-assessments.com/assessment" style="background-color: #4361ee; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Start Assessment Now</a>
            </div>
            <p>Your access code is valid for one year from today.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            <p>© 2025 Atlas Assessment. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Email sending error:", error);
      return false;
    }
    console.log("Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing payment for session:", sessionId);
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Session status:", session.payment_status);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment is not complete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client (using service role key to bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Generate a new access code
    const accessCode = generateAccessCode();
    
    // Calculate expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    console.log("Creating access code:", accessCode);

    // Extract pricing information from session
    const amountTotal = session.amount_total ? session.amount_total / 100 : 39; // Convert from cents
    const currency = session.currency?.toUpperCase() || 'EUR';

    // Store the access code in the database with pricing info
    const { data: codeData, error: codeError } = await supabaseAdmin
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
      return new Response(
        JSON.stringify({ error: "Failed to create access code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract customer information from session metadata
    const customerEmail = session.customer_details?.email;
    const firstName = session.metadata?.firstName || "Customer";
    const lastName = session.metadata?.lastName || "";
    const country = session.metadata?.country || "Unknown";

    console.log("Customer details:", { customerEmail, firstName, lastName, country });

    // Store the purchase details
    const { error: purchaseError } = await supabaseAdmin
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
      console.error("Error recording purchase:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Failed to record purchase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Purchase recorded successfully");

    // Send the access code via email
    if (customerEmail) {
      const emailSent = await sendAccessCodeEmail(customerEmail, firstName, lastName, accessCode);
      if (!emailSent) {
        console.warn("Warning: Email could not be sent, but purchase was successful");
      }
    }

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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
