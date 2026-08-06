import { Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

export function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
      <Title level={2}>Privacy Policy</Title>
      <Paragraph type="secondary">Last updated: [DATE]</Paragraph>

      <Paragraph>
        Omnichannel Command Center ("we", "us", "the platform") is a customer support tool that
        lets businesses ("organizations") manage conversations with their own customers across
        email, WhatsApp, Facebook Messenger, Instagram, and SMS from one place. This policy
        explains what data we handle and how.
      </Paragraph>

      <Title level={4}>What we collect</Title>
      <Paragraph>
        When an organization connects a channel (e.g. a WhatsApp Business number, a Facebook
        Page, an email inbox), we receive and store the messages exchanged between that
        organization and its customers on that channel, along with basic contact identifiers
        needed to route the conversation (e.g. a phone number, a Messenger/Instagram-scoped
        user ID, an email address). We also store account information for the organization's own
        staff (name, email, role) who use the platform.
      </Paragraph>

      <Title level={4}>How we use it</Title>
      <Paragraph>
        Data is used solely to operate the messaging platform for the organization that owns
        it: displaying conversation threads, routing messages to the right agent, and sending
        replies on the organization's behalf through the channel the customer contacted them on.
        We do not sell customer data, and we do not use one organization's data for another
        organization's benefit — each organization's data is isolated from every other
        organization on the platform.
      </Paragraph>

      <Title level={4}>Third-party processors</Title>
      <Paragraph>
        To deliver messages, we send and receive data through the messaging providers each
        organization connects: Meta's Graph API (for WhatsApp, Messenger, and Instagram) and
        the organization's own email provider (via standard SMTP/IMAP). These providers process
        message content as part of transmitting it — see Meta's Privacy Policy at{' '}
        <Text code>https://www.facebook.com/privacy/policy</Text> for how they handle data sent
        through their platforms.
      </Paragraph>

      <Title level={4}>Data retention</Title>
      <Paragraph>
        Conversation and customer data is retained for as long as the organization's account is
        active, so agents can reference conversation history. An organization can request
        deletion of its data by contacting us at the address below.
      </Paragraph>

      <Title level={4}>Your rights</Title>
      <Paragraph>
        If you are a customer who has messaged a business using this platform and want your data
        removed, contact that business directly — they control the data as the account owner. If
        you are an organization using the platform, contact us using the details below to request
        export or deletion of your account's data.
      </Paragraph>

      <Title level={4}>Contact</Title>
      <Paragraph>
        Questions about this policy: <Text code>[CONTACT EMAIL]</Text>
      </Paragraph>

      <Paragraph type="secondary" style={{ marginTop: 32 }}>
        This document is a starting template, not legal advice — have it reviewed against your
        jurisdiction's requirements (and Meta Platform Terms) before relying on it in production.
      </Paragraph>
    </div>
  );
}
