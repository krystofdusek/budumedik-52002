import React from 'https://esm.sh/react@18.3.1'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import VerificationEmail from './_templates/verification-email.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY)

interface DirectRequestBody {
  email: string
  name?: string
  redirectTo?: string
}

Deno.serve(async (req) => {
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
    const { email, name, redirectTo }: DirectRequestBody = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const safeRedirect = redirectTo || `${SUPABASE_URL}/email-verified`

    // Generate a magic link that will also verify the email upon click
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: safeRedirect },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink error:', linkError)
      return new Response(
        JSON.stringify({ error: linkError?.message || 'Failed to generate verification link' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const actionLink = linkData.properties.action_link
    const token = (linkData.properties as any).email_otp

    const html = await renderAsync(
      React.createElement(VerificationEmail, {
        name,
        action_link: actionLink,
        token,
      })
    )

    const { error: sendError } = await resend.emails.send({
      from: 'Budu Medik <info@budumedik.cz>',
      to: [email],
      subject: 'Ověřte svůj e‑mail – Budu Medik',
      html,
    })

    if (sendError) {
      console.error('Resend send error:', sendError)
      return new Response(JSON.stringify({ error: sendError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
