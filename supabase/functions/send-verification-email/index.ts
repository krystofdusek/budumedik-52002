import { Resend } from 'https://esm.sh/resend@4.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

interface VerificationEmailRequest {
  email: string
  token?: string
  redirectTo?: string
}

Deno.serve(async (req) => {
  console.log('=== send-verification-email function called ===')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  try {
    const { email, redirectTo }: VerificationEmailRequest = await req.json()
    console.log('📧 Received request for email:', email)

    if (!email) {
      console.error('❌ Missing email in request')
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const safeRedirect = redirectTo || 'https://jcabdfmvjblzulnvvuso.supabase.co/email-verified'
    const verificationLink = safeRedirect
    console.log('🔗 Using redirect URL:', safeRedirect)

    // Create HTML email with simple verification message
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); padding: 40px 24px;">
                  <tr>
                    <td>
                      <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 0 0 16px; text-align: center;">
                        Vítejte v Budu Medik!
                      </h1>
                      <p style="color: #334155; font-size: 16px; line-height: 24px; margin: 16px 0;">
                        Děkujeme za registraci. Váš účet byl úspěšně vytvořen a nyní se můžete přihlásit.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${verificationLink}" target="_blank" style="background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 10px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: 700; padding: 14px 28px; text-decoration: none; box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);">
                              Přejít na dashboard
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #64748b; font-size: 14px; line-height: 20px; margin: 24px 0 16px;">
                        Pokud jste se neregistrovali do Budu Medik, můžete tento e‑mail bezpečně ignorovat.
                      </p>
                      <p style="color: #64748b; font-size: 14px; line-height: 20px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                        S pozdravem,<br>
                        Tým Budu Medik
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    console.log('📤 Sending email via Resend...')
    const { data: emailData, error: sendError } = await resend.emails.send({
      from: 'Budu Medik <info@budumedik.cz>',
      to: [email],
      subject: 'Vítejte v Budu Medik!',
      html,
    })

    if (sendError) {
      console.error('❌ Resend error:', sendError)
      return new Response(JSON.stringify({ error: sendError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    console.log('✅ Email sent successfully via Resend:', emailData)
    return new Response(JSON.stringify({ ok: true, emailId: emailData?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('💥 Unexpected error:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
