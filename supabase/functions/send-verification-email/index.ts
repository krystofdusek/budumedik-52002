import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DirectRequestBody {
  email: string;
  redirectTo?: string;
  name?: string;
}

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Direct mode: receive { email, redirectTo }
    const { email, redirectTo }: DirectRequestBody = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const finalRedirect = redirectTo || `${Deno.env.get("VITE_SITE_URL") ?? ""}/email-verified`;

    // Generate a magic link which also verifies the email upon usage
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: finalRedirect },
    } as any);

    if (linkError) {
      console.error("Error generating link:", linkError);
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const actionLink = (linkData as any)?.properties?.action_link as string | undefined;

    if (!actionLink) {
      console.error("No action_link returned from generateLink", linkData);
      return new Response(JSON.stringify({ error: "Nepodařilo se vytvořit ověřovací odkaz" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email via Resend
    await resend.emails.send({
      from: "MedPrep <onboarding@resend.dev>",
      to: [email],
      subject: "Ověřte svůj e‑mail – MedPrep",
      html: `
        <h1>Vítejte v MedPrep!</h1>
        <p>Děkujeme za registraci. Pro dokončení prosím ověřte svůj e‑mail.</p>
        <p><a href="${actionLink}" style="display:inline-block;padding:12px 20px;background:#0066cc;color:#fff;text-decoration:none;border-radius:6px">Ověřit e‑mail</a></p>
        <p>Pokud tlačítko nefunguje, zkopírujte a vložte tento odkaz do prohlížeče:</p>
        <p><a href="${actionLink}">${actionLink}</a></p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
