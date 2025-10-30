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

    // Send email via Resend with beautiful design
    await resend.emails.send({
      from: "Budu Medik <onboarding@resend.dev>",
      to: [email],
      subject: "🎓 Ověřte svůj e‑mail – Budu Medik",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ověřte svůj e‑mail</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f6f9fc;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center;">
                      <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                        <span style="font-size: 32px;">🎓</span>
                      </div>
                      <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; line-height: 1.2;">Vítejte v Budu Medik!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                        Děkujeme za registraci! 🎉 Těší nás, že se připravujete na studium medicíny s námi.
                      </p>
                      <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin: 0 0 32px;">
                        Pro dokončení registrace prosím ověřte svou emailovou adresu kliknutím na tlačítko níže:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 0 0 32px;">
                            <a href="${actionLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                              ✓ Ověřit emailovou adresu
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #8a8a8a; font-size: 14px; line-height: 20px; margin: 0 0 16px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
                        Pokud tlačítko nefunguje, zkopírujte a vložte tento odkaz do prohlížeče:
                      </p>
                      <p style="color: #667eea; font-size: 13px; line-height: 18px; margin: 0; word-break: break-all;">
                        ${actionLink}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #8a8a8a; font-size: 13px; line-height: 18px; margin: 0 0 8px;">
                        Pokud jste se neregistrovali na Budu Medik, můžete tento email bezpečně ignorovat.
                      </p>
                      <p style="color: #8a8a8a; font-size: 13px; line-height: 18px; margin: 0;">
                        S pozdravem,<br><strong style="color: #667eea;">Tým Budu Medik</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
