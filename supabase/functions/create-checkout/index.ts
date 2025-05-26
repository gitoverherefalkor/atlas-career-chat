
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe API key not configured");
      throw new Error("Stripe API key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Verify the Stripe account is active before proceeding
    try {
      await stripe.balance.retrieve();
      console.log("Stripe account validated successfully");
    } catch (stripeError) {
      console.error("Stripe account error:", stripeError);
      const errorMsg = stripeError instanceof Error ? stripeError.message : "Stripe account error";
      
      if (errorMsg.includes("invalid api key") || errorMsg.includes("Invalid API Key")) {
        throw new Error("Payment system is not properly configured: Invalid API key.");
      } else if (errorMsg.includes("account") && (errorMsg.includes("inactive") || errorMsg.includes("not activated"))) {
        throw new Error("Payment system account is not active yet.");
      } else {
        throw new Error(`Payment system error: ${errorMsg}`);
      }
    }

    const { firstName, lastName, email, country } = await req.json();

    if (!firstName || !lastName || !email || !country) {
      return new Response(
        JSON.stringify({ error: "First name, last name, email, and country are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating checkout session for:", email, "Country:", country);
    
    // Define payment methods based on country
    const paymentMethods = ["card"];
    
    // Add iDEAL for Netherlands
    if (country === "Netherlands") {
      paymentMethods.push("ideal");
    }
    
    // Add European payment methods
    if (["Germany", "Belgium"].includes(country)) {
      paymentMethods.push("ideal");
    }
    
    // Add Klarna for supported countries
    if (["Germany", "Austria", "Finland", "Netherlands", "Belgium", "Sweden", "United Kingdom"].includes(country)) {
      paymentMethods.push("klarna");
    }
    
    // Add SEPA Direct Debit for EU countries
    const euCountries = [
      "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", 
      "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", 
      "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", 
      "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", 
      "Slovenia", "Spain", "Sweden"
    ];
    if (euCountries.includes(country)) {
      paymentMethods.push("sepa_debit");
    }
    
    // Add other country-specific payment methods
    if (country === "Belgium") {
      paymentMethods.push("bancontact");
    }
    
    if (country === "Austria") {
      paymentMethods.push("eps");
    }
    
    if (country === "Germany") {
      paymentMethods.push("giropay");
    }
    
    if (country === "Poland") {
      paymentMethods.push("p24");
    }
    
    console.log("Available payment methods:", paymentMethods);
    
    // Get the origin from request headers or use the live domain
    const origin = req.headers.get("origin") || "https://atlas-assessments.com";
    console.log("Using origin for URLs:", origin);
    
    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Atlas Assessment",
              description: "Complete assessment with personalized career insights",
            },
            unit_amount: 3900, // €39.00 (beta price)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      customer_email: email,
      metadata: {
        firstName,
        lastName,
        email,
        country,
      },
      locale: country === "Netherlands" ? "nl" : country === "Germany" ? "de" : "auto",
      billing_address_collection: 'required',
    });

    console.log("Checkout session created:", session.id, "URL:", session.url);
    
    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
