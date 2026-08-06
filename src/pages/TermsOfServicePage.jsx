import { Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

export function TermsOfServicePage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
      <Title level={2}>Terms of Service</Title>
      <Paragraph type="secondary">Last updated: [DATE]</Paragraph>

      <Paragraph>
        These terms govern use of Omnichannel Command Center ("the platform"), a customer
        support tool that lets an organization manage conversations with its own customers
        across email, WhatsApp, Facebook Messenger, Instagram, and SMS. By creating an account
        or using the platform, an organization agrees to these terms.
      </Paragraph>

      <Title level={4}>What the platform does</Title>
      <Paragraph>
        The platform lets an organization connect messaging channels it owns or is authorized
        to use (e.g. its own WhatsApp Business number, its own Facebook Page, its own email
        inbox), and provides tools for its staff to view and reply to customer messages sent to
        those channels.
      </Paragraph>

      <Title level={4}>Organization responsibilities</Title>
      <Paragraph>
        An organization is responsible for: only connecting channels it owns or has authority to
        operate; complying with the terms of use of each connected provider (Meta Platform Terms
        for WhatsApp/Messenger/Instagram, and its email provider's terms); and obtaining any
        consent required by law before messaging its customers on a given channel.
      </Paragraph>

      <Title level={4}>Acceptable use</Title>
      <Paragraph>
        The platform may not be used to send unsolicited bulk messages (spam), to harass, or for
        any purpose that violates applicable law or the policies of a connected messaging
        provider. We may suspend an account that violates this.
      </Paragraph>

      <Title level={4}>Availability</Title>
      <Paragraph>
        The platform is provided on an "as is" basis. We aim for reliable uptime but do not
        guarantee uninterrupted availability, and are not responsible for outages or message
        delivery failures caused by third-party providers (Meta, email providers, network
        carriers).
      </Paragraph>

      <Title level={4}>Termination</Title>
      <Paragraph>
        An organization may stop using the platform and request account/data deletion at any
        time. We may suspend or terminate an account that violates these terms or applicable law.
      </Paragraph>

      <Title level={4}>Contact</Title>
      <Paragraph>
        Questions about these terms: <Text code>[CONTACT EMAIL]</Text>
      </Paragraph>

      <Paragraph type="secondary" style={{ marginTop: 32 }}>
        This document is a starting template, not legal advice — have it reviewed against your
        jurisdiction's requirements before relying on it in production.
      </Paragraph>
    </div>
  );
}
