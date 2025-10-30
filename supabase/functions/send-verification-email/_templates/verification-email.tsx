import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface VerificationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const VerificationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Potvrďte svou emailovou adresu</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Vítejte v MedPrep! 🎓</Heading>
        <Text style={text}>
          Děkujeme za registraci. Pro dokončení nastavení vašeho účtu prosím ověřte svou emailovou adresu.
        </Text>
        <Section style={buttonContainer}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            style={button}
          >
            Ověřit emailovou adresu
          </Link>
        </Section>
        <Text style={text}>
          Nebo zkopírujte tento ověřovací kód:
        </Text>
        <code style={code}>{token}</code>
        <Text style={disclaimer}>
          Pokud jste se neregistrovali na MedPrep, můžete tento email bezpečně ignorovat.
        </Text>
        <Text style={footer}>
          S pozdravem,<br />
          Tým MedPrep
        </Text>
      </Container>
    </Body>
  </Html>
)

export default VerificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#0066cc',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const code = {
  display: 'block',
  padding: '16px',
  backgroundColor: '#f4f4f4',
  borderRadius: '6px',
  border: '1px solid #e0e0e0',
  color: '#1a1a1a',
  fontSize: '14px',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const disclaimer = {
  color: '#8a8a8a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 16px',
}

const footer = {
  color: '#8a8a8a',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '32px',
  borderTop: '1px solid #e0e0e0',
  paddingTop: '24px',
}
