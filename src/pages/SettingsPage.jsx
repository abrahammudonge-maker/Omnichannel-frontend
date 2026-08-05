import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, Input, InputNumber, Popconfirm, Row, Select, Table, Tabs, Tag, Typography, App as AntApp } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import {
  createChannelAccount,
  createOrganizationSetting,
  deleteChannelAccount,
  deleteOrganizationSetting,
  getChannelAccounts,
  getCurrentUser,
  getOrganizationById,
  getOrganizationSettings
} from '../api';

const CHANNEL_TYPES = ['WhatsApp', 'FacebookMessenger', 'Instagram', 'Email', 'Sms'];

const EMAIL_PROVIDER_PRESETS = {
  'outlook.com': { name: 'Outlook', smtpHost: 'smtp-mail.outlook.com', smtpPort: 587, imapHost: 'outlook.office365.com', imapPort: 993 },
  'hotmail.com': { name: 'Outlook', smtpHost: 'smtp-mail.outlook.com', smtpPort: 587, imapHost: 'outlook.office365.com', imapPort: 993 },
  'live.com': { name: 'Outlook', smtpHost: 'smtp-mail.outlook.com', smtpPort: 587, imapHost: 'outlook.office365.com', imapPort: 993 },
  'msn.com': { name: 'Outlook', smtpHost: 'smtp-mail.outlook.com', smtpPort: 587, imapHost: 'outlook.office365.com', imapPort: 993 },
  'gmail.com': { name: 'Gmail', smtpHost: 'smtp.gmail.com', smtpPort: 587, imapHost: 'imap.gmail.com', imapPort: 993 },
  'yahoo.com': { name: 'Yahoo', smtpHost: 'smtp.mail.yahoo.com', smtpPort: 587, imapHost: 'imap.mail.yahoo.com', imapPort: 993 },
  'zoho.com': { name: 'Zoho', smtpHost: 'smtp.zoho.com', smtpPort: 587, imapHost: 'imap.zoho.com', imapPort: 993 },
  'icloud.com': { name: 'iCloud', smtpHost: 'smtp.mail.me.com', smtpPort: 587, imapHost: 'imap.mail.me.com', imapPort: 993 },
  'me.com': { name: 'iCloud', smtpHost: 'smtp.mail.me.com', smtpPort: 587, imapHost: 'imap.mail.me.com', imapPort: 993 }
};

function resolveEmailProvider(address) {
  const domain = address?.split('@')[1]?.toLowerCase();
  return domain ? EMAIL_PROVIDER_PRESETS[domain] : undefined;
}

function ProfileTab() {
  const currentUser = getCurrentUser();
  const { message } = AntApp.useApp();
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    if (!currentUser?.organizationId) return;
    getOrganizationById(currentUser.organizationId).then(setOrganization).catch((err) => message.error(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!organization) return <Card loading />;

  return (
    <Card title={organization.name}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Email">{organization.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{organization.phone}</Descriptions.Item>
        <Descriptions.Item label="Country">{organization.country}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color="green">{organization.status}</Tag></Descriptions.Item>
        <Descriptions.Item label="Created">{new Date(organization.createdAt).toLocaleString()}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

function CustomSettingsTab() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [settings, setSettings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => getOrganizationSettings().then(setSettings);

  useEffect(() => { load().catch((err) => message.error(err.message)).finally(() => setLoading(false)); }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createOrganizationSetting(values);
      await load();
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOrganizationSetting(id);
      await load();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Key', dataIndex: 'settingName' },
    { title: 'Value', dataIndex: 'settingValue' },
    {
      title: '', key: 'actions', width: 60,
      render: (_, s) => (
        <Popconfirm title="Delete this setting?" onConfirm={() => handleDelete(s.id)}>
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      )
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="Add a setting">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="settingName" label="Key" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="settingValue" label="Value" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>Add setting</Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card title="Settings">
          <Table rowKey="id" loading={loading} dataSource={settings} columns={columns} pagination={{ pageSize: 8 }} />
        </Card>
      </Col>
    </Row>
  );
}

function ChannelsTab() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [accounts, setAccounts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => getChannelAccounts().then(setAccounts);

  useEffect(() => { load().catch((err) => message.error(err.message)).finally(() => setLoading(false)); }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createChannelAccount(values);
      await load();
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteChannelAccount(id);
      await load();
    } catch (err) {
      message.error(err.message);
    }
  };

  const channelType = Form.useWatch('channelType', form);
  const mailboxAddress = Form.useWatch('externalAccountId', form);
  const isEmail = channelType === 'Email';
  const detectedProvider = isEmail ? resolveEmailProvider(mailboxAddress) : undefined;

  const handleMailboxChange = (event) => {
    const preset = resolveEmailProvider(event.target.value);
    if (preset) {
      form.setFieldsValue({
        smtpHost: preset.smtpHost,
        smtpPort: preset.smtpPort,
        imapHost: preset.imapHost,
        imapPort: preset.imapPort
      });
    }
  };

  const columns = [
    { title: 'Display name', dataIndex: 'displayName' },
    { title: 'Type', dataIndex: 'channelType', render: (t) => <Tag>{t}</Tag> },
    { title: 'Mailbox', dataIndex: 'externalAccountId', render: (v) => v || '—' },
    { title: 'SMTP', dataIndex: 'smtpHost', render: (v, a) => (v ? `${v}:${a.smtpPort}` : '—') },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color="green">{s}</Tag> },
    {
      title: '', key: 'actions', width: 60,
      render: (_, a) => (
        <Popconfirm title="Remove this channel?" onConfirm={() => handleDelete(a.id)}>
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      )
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="Connect a channel">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title={isEmail
              ? "Live: connects a real mailbox via SMTP/IMAP. Sending happens immediately when an agent replies; incoming email is polled every 30 seconds and turned into new conversations. Gmail, Outlook/Hotmail, Yahoo, Zoho, and iCloud are auto-detected — any other domain, enter the SMTP/IMAP server yourself."
              : "This channel type is a placeholder for now — only Email sends and receives for real. WhatsApp/Messenger/Instagram/SMS are the next phase of work."}
          />
          <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ channelType: 'Email' }}>
            <Form.Item name="channelType" label="Channel type" rules={[{ required: true }]}>
              <Select options={CHANNEL_TYPES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="displayName" label="Display name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Support Inbox" />
            </Form.Item>
            {isEmail && (
              <>
                <Form.Item
                  name="externalAccountId"
                  label="Mailbox address"
                  rules={[{ required: true, type: 'email' }]}
                  tooltip="Use a dedicated inbox, not your personal one."
                >
                  <Input placeholder="support@yourdomain.com" onChange={handleMailboxChange} />
                </Form.Item>
                <Form.Item
                  name="accessToken"
                  label="App password"
                  rules={[{ required: true }]}
                  tooltip="An app-specific password from your provider's security settings — not your regular login password."
                >
                  <Input.Password placeholder="xxxx xxxx xxxx xxxx" />
                </Form.Item>

                <Alert
                  type={detectedProvider ? 'success' : 'warning'}
                  showIcon
                  style={{ marginBottom: 16 }}
                  title={detectedProvider
                    ? `Detected ${detectedProvider.name} — server settings filled in below (edit if needed).`
                    : mailboxAddress
                      ? "Unrecognized domain — enter this provider's SMTP/IMAP server settings below."
                      : 'Enter a mailbox address above to auto-fill server settings for common providers.'}
                />

                <Form.Item name="smtpHost" label="SMTP host" rules={[{ required: true }]}>
                  <Input placeholder="smtp.yourprovider.com" />
                </Form.Item>
                <Form.Item name="smtpPort" label="SMTP port" rules={[{ required: true }]} initialValue={587}>
                  <InputNumber style={{ width: '100%' }} placeholder="587" />
                </Form.Item>
                <Form.Item name="imapHost" label="IMAP host" rules={[{ required: true }]}>
                  <Input placeholder="imap.yourprovider.com" />
                </Form.Item>
                <Form.Item name="imapPort" label="IMAP port" rules={[{ required: true }]} initialValue={993}>
                  <InputNumber style={{ width: '100%' }} placeholder="993" />
                </Form.Item>
              </>
            )}
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>Add channel</Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card title="Connected channels">
          <Table rowKey="id" loading={loading} dataSource={accounts} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: true }} />
        </Card>
      </Col>
    </Row>
  );
}

export function SettingsPage() {
  return (
    <>
      <Typography.Title level={2}>Settings</Typography.Title>
      <Typography.Paragraph type="secondary">Organization profile, custom configuration, and connected channels.</Typography.Paragraph>

      <Tabs
        items={[
          { key: 'profile', label: 'Profile', children: <ProfileTab /> },
          { key: 'custom', label: 'Custom settings', children: <CustomSettingsTab /> },
          { key: 'channels', label: 'Channels', children: <ChannelsTab /> }
        ]}
      />
    </>
  );
}
