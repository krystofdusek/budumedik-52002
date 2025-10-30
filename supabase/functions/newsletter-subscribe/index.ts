import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: SubscribeRequest = await req.json();

    console.log("Subscribing email to newsletter:", email);

    // Add contact to Resend audience
    const audienceId = Deno.env.get("RESEND_AUDIENCE_ID");
    
    if (!audienceId) {
      throw new Error("RESEND_AUDIENCE_ID is not configured");
    }

    const contact = await resend.contacts.create({
      email,
      firstName: name || "",
      unsubscribed: false,
      audienceId,
    });

    console.log("Contact added to audience:", contact);

    // Send welcome email
    await resend.emails.send({
      from: "MedPrep <onboarding@resend.dev>",
      to: [email],
      subject: "Vítejte v MedPrep newsletteru! 📚",
      html: `
        <h1>Vítejte v MedPrep newsletteru!</h1>
        <p>Děkujeme za přihlášení k odběru našeho newsletteru${name ? `, ${name}` : ''}.</p>
        <p>Budeme vás informovat o:</p>
        <ul>
          <li>Nových otázkách a testech</li>
          <li>Tipech na přípravu ke zkouškám</li>
          <li>Aktualizacích platformy</li>
        </ul>
        <p>S pozdravem,<br>Tým MedPrep</p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Úspěšně přihlášeno k odběru newsletteru" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in newsletter-subscribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
