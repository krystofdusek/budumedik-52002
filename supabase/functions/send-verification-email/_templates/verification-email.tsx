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
  name?: string
  action_link: string
  token?: string
}

export const VerificationEmail = ({ name, action_link, token }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Ověřte svou e‑mailovou adresu</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Vítejte v Budu Medik!</Heading>
        <Text style={text}>
          Děkujeme za registraci. Pro dokončení nastavení účtu prosím ověřte svou e‑mailovou adresu.
        </Text>

        <Section style={buttonContainer}>
          <Link href={action_link} target="_blank" style={button}>
            Ověřit e‑mailovou adresu
          </Link>
        </Section>

        <Text style={disclaimer}>
          Pokud jste se neregistrovali do Budu Medik, můžete tento e‑mail bezpečně ignorovat.
        </Text>
        <Text style={footer}>
          S pozdravem,<br />
          Tým Budu Medik
        </Text>
      </Container>
    </Body>
  </Html>
)

export default VerificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 24px',
  borderRadius: '12px',
  maxWidth: '600px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
}

const h1 = {
  color: '#0f172a',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
}

const button = {
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  borderRadius: '10px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 700,
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  boxShadow: '0 8px 20px rgba(124, 58, 237, 0.25)',
}

const code = {
  display: 'block',
  padding: '16px',
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  color: '#0f172a',
  fontSize: '14px',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  margin: '16px 0',
}

const disclaimer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 16px',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '24px',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '16px',
}
