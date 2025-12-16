
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    console.log("Testing email sending to:", email);
    
    const { data, error } = await resend.emails.send({
      from: "Atlas Assessment <no-reply@atlas-assessments.com>",
      to: [email],
      subject: "Atlas Assessment - Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #4361ee;">Email Test Successful!</h1>
          <p>This is a test email from Atlas Assessment to verify that our email system is working correctly.</p>
          <p>If you received this email, our email integration is working properly.</p>
          <p>Test sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Email test failed:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email test successful:", data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test email sent successfully",
        data: data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
