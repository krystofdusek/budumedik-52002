import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  password: string;
  redirectTo: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, redirectTo }: EmailRequest = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate email confirmation link
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
      options: {
        redirectTo: redirectTo
      }
    });

    if (linkError) {
      console.error('Error generating link:', linkError);
      throw linkError;
    }

    console.log('Confirmation link generated for:', email);

    // Import Resend dynamically
    const { Resend } = await import("https://esm.sh/resend@3.2.0");
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const confirmationUrl = data.properties.action_link;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Budu Medik <onboarding@resend.dev>',
      to: [email],
      subject: 'Potvrďte svou registraci - Budu Medik',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Potvrzení registrace</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                          <span style="font-size: 32px;">🎓</span>
                        </div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1a1a1a;">Vítejte v Budu Medik!</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px;">
                        <p style="font-size: 16px; line-height: 24px; color: #666; margin: 0 0 24px;">
                          Děkujeme za registraci! Pro dokončení registrace a aktivaci vašeho účtu prosím potvrďte svou e-mailovou adresu kliknutím na tlačítko níže.
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(155, 135, 245, 0.3);">
                                Potvrdit e-mail
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="font-size: 14px; line-height: 20px; color: #999; margin: 24px 0 0;">
                          Pokud tlačítko nefunguje, zkopírujte a vložte tento odkaz do prohlížeče:
                        </p>
                        <p style="font-size: 12px; color: #9b87f5; word-break: break-all; margin: 8px 0 0;">
                          ${confirmationUrl}
                        </p>
                        
                        <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #eee;">
                          <p style="font-size: 14px; color: #999; margin: 0;">
                            Pokud jste se neregistrovali na Budu Medik, tento e-mail ignorujte.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                          © 2025 Budu Medik. Všechna práva vyhrazena.
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

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ success: true, message: 'Confirmation email sent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in send-confirmation-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
