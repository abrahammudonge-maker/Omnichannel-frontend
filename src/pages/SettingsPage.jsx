import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tabs, Tag, Typography, App as AntApp } from 'antd';
import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import {
  confirmMetaChannel,
  createApiKey,
  createChannelAccount,
  createMessageTemplate,
  createOrganizationSetting,
  deleteChannelAccount,
  deleteOrganizationSetting,
  discoverMetaChannel,
  getApiKeys,
  getChannelAccounts,
  getCurrentUser,
  getMessageTemplatesByChannel,
  getOrganizationById,
  getOrganizationSettings,
  revokeApiKey,
  syncMessageTemplates,
  updateChannelAccount
} from '../api';
import { launchMetaSignup } from '../facebookSdk';

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

const META_CHANNELS = ['WhatsApp', 'FacebookMessenger', 'Instagram'];
const META_PLATFORM_ID_FIELD = {
  WhatsApp: { label: 'Phone Number ID', placeholder: 'From WhatsApp > API Setup in Meta App Dashboard' },
  FacebookMessenger: { label: 'Facebook Page ID', placeholder: 'From your Page\'s About section' },
  Instagram: { label: 'Instagram Business Account ID', placeholder: 'From Instagram > API Setup in Meta App Dashboard' }
};
const WEBHOOK_PATH = '/api/webhooks/meta';
const SMS_WEBHOOK_PATH = '/api/webhooks/sms';
const META_CONFIG_ID = {
  WhatsApp: import.meta.env.VITE_META_WHATSAPP_CONFIG_ID,
  FacebookMessenger: import.meta.env.VITE_META_FACEBOOK_CONFIG_ID,
  Instagram: import.meta.env.VITE_META_FACEBOOK_CONFIG_ID
};

function randomToken() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
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
  const [connecting, setConnecting] = useState(false);
  const [pendingSignup, setPendingSignup] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [editForm] = Form.useForm();
  const [editingAccount, setEditingAccount] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const finishConnect = async (channelType, sessionId, selectedId) => {
    await confirmMetaChannel({ channelType, sessionId, selectedId });
    await load();
    message.success(`${channelType} connected.`);
  };

  const handleConnectMeta = async (channelType) => {
    setConnecting(true);
    try {
      const { code, redirectUri } = await launchMetaSignup(META_CONFIG_ID[channelType]);
      const { sessionId, candidates } = await discoverMetaChannel({ channelType, code, redirectUri });
      if (candidates.length === 1) {
        await finishConnect(channelType, sessionId, candidates[0].id);
      } else {
        setPendingSignup({ channelType, sessionId, candidates });
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleConfirmCandidate = async () => {
    if (!selectedCandidateId) return;
    setConfirming(true);
    try {
      await finishConnect(pendingSignup.channelType, pendingSignup.sessionId, selectedCandidateId);
      setPendingSignup(null);
      setSelectedCandidateId(null);
    } catch (err) {
      message.error(err.message);
    } finally {
      setConfirming(false);
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

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    editForm.setFieldsValue({
      displayName: account.displayName,
      externalAccountId: account.externalAccountId,
      externalWabaId: account.externalWabaId,
      smtpHost: account.smtpHost,
      smtpPort: account.smtpPort,
      imapHost: account.imapHost,
      imapPort: account.imapPort,
      status: account.status,
      accessToken: '',
      refreshToken: '',
      webhookSecret: ''
    });
  };

  const handleSaveEdit = async (values) => {
    setSavingEdit(true);
    try {
      await updateChannelAccount(editingAccount.id, {
        ...values,
        channelType: editingAccount.channelType,
        accessToken: values.accessToken || null,
        refreshToken: values.refreshToken || null,
        webhookSecret: values.webhookSecret || null
      });
      message.success('Channel updated.');
      setEditingAccount(null);
      await load();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const channelType = Form.useWatch('channelType', form);
  const mailboxAddress = Form.useWatch('externalAccountId', form);
  const smsWebhookSecret = Form.useWatch('webhookSecret', form);
  const isEmail = channelType === 'Email';
  const isMeta = META_CHANNELS.includes(channelType);
  const isSms = channelType === 'Sms';
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
    { title: 'Account ID', dataIndex: 'externalAccountId', render: (v) => v || '—' },
    { title: 'WABA ID', dataIndex: 'externalWabaId', render: (v) => v || '—' },
    { title: 'SMTP', dataIndex: 'smtpHost', render: (v, a) => (v ? `${v}:${a.smtpPort}` : '—') },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color="green">{s}</Tag> },
    {
      title: '', key: 'actions', width: 90,
      render: (_, a) => (
        <Space>
          <Button icon={<EditOutlined />} type="text" onClick={() => handleOpenEdit(a)} />
          <Popconfirm title="Remove this channel?" onConfirm={() => handleDelete(a.id)}>
            <Button icon={<DeleteOutlined />} danger type="text" />
          </Popconfirm>
        </Space>
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
              : isMeta
                ? "Live, but requires a Meta Developer App with this product added, and a public HTTPS URL (e.g. via ngrok) for the webhook below — Meta cannot reach localhost directly. Sending works as soon as the access token is valid; receiving requires the webhook to be registered in the Meta App Dashboard."
                : isSms
                  ? "Live: sends via the Twilio REST API. Sending works as soon as the credentials are valid; receiving requires the webhook below to be registered with your SMS provider."
                  : undefined}
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
            {isMeta && (
              <>
                <Button
                  block
                  loading={connecting}
                  disabled={!META_CONFIG_ID[channelType]}
                  onClick={() => handleConnectMeta(channelType)}
                  style={{ marginBottom: 16 }}
                >
                  Connect via Meta
                </Button>
                {!META_CONFIG_ID[channelType] && (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    title="Not configured yet"
                    description="This channel's Meta configuration ID isn't set (VITE_META_WHATSAPP_CONFIG_ID / VITE_META_FACEBOOK_CONFIG_ID). Enter details manually below in the meantime, or add the config ID once it exists in the Meta App Dashboard."
                  />
                )}
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Or enter details manually:
                </Typography.Text>
                <Form.Item
                  name="externalAccountId"
                  label={META_PLATFORM_ID_FIELD[channelType].label}
                  rules={[{ required: true }]}
                >
                  <Input placeholder={META_PLATFORM_ID_FIELD[channelType].placeholder} />
                </Form.Item>
                {channelType === 'WhatsApp' && (
                  <Form.Item
                    name="externalWabaId"
                    label="WhatsApp Business Account ID"
                    tooltip="From WhatsApp > API Setup in Meta App Dashboard. Required to design and sync message templates for this number — templates live at the WABA level, not per number."
                  >
                    <Input placeholder="e.g. 105948015053410" />
                  </Form.Item>
                )}
                <Form.Item
                  name="accessToken"
                  label="Access token"
                  rules={[{ required: true }]}
                  tooltip="A long-lived Page/System User access token from the Meta App Dashboard, scoped with messaging permissions for this product."
                >
                  <Input.Password placeholder="EAAG..." />
                </Form.Item>
                <Form.Item
                  label="Webhook verify token"
                  required
                  tooltip="A secret you choose. Enter this exact value as the Verify Token when configuring the webhook in the Meta App Dashboard."
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="webhookSecret" noStyle rules={[{ required: true }]}>
                      <Input placeholder="Any random string you choose" />
                    </Form.Item>
                    <Button icon={<ReloadOutlined />} onClick={() => form.setFieldValue('webhookSecret', randomToken())} />
                  </Space.Compact>
                </Form.Item>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title="Webhook callback URL"
                  description={
                    <>
                      <div>Register this path in Meta App Dashboard → Webhooks, behind your public tunnel host:</div>
                      <code style={{ display: 'block', marginTop: 6, wordBreak: 'break-all' }}>
                        https://&lt;your-ngrok-host&gt;{WEBHOOK_PATH}
                        <CopyOutlined
                          style={{ marginLeft: 8, cursor: 'pointer' }}
                          onClick={() => navigator.clipboard.writeText(WEBHOOK_PATH)}
                        />
                      </code>
                    </>
                  }
                />
              </>
            )}
            {isSms && (
              <>
                <Form.Item
                  name="externalAccountId"
                  label="From number"
                  rules={[{ required: true }]}
                  tooltip="The SMS-capable number in E.164 format, e.g. +15555550100."
                >
                  <Input placeholder="+15555550100" />
                </Form.Item>
                <Form.Item
                  name="refreshToken"
                  label="Account SID"
                  rules={[{ required: true }]}
                  tooltip="From your Twilio Console dashboard."
                >
                  <Input placeholder="AC..." />
                </Form.Item>
                <Form.Item
                  name="accessToken"
                  label="Auth Token"
                  rules={[{ required: true }]}
                  tooltip="From your Twilio Console dashboard."
                >
                  <Input.Password placeholder="Auth Token" />
                </Form.Item>
                <Form.Item
                  label="Webhook secret"
                  required
                  tooltip="A secret you choose. Appended as ?token=... to the webhook URL below so only your provider can post inbound messages."
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="webhookSecret" noStyle rules={[{ required: true }]}>
                      <Input placeholder="Any random string you choose" />
                    </Form.Item>
                    <Button icon={<ReloadOutlined />} onClick={() => form.setFieldValue('webhookSecret', randomToken())} />
                  </Space.Compact>
                </Form.Item>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title="Webhook callback URL"
                  description={
                    <>
                      <div>Register this URL as the "incoming message" webhook with your SMS provider:</div>
                      <code style={{ display: 'block', marginTop: 6, wordBreak: 'break-all' }}>
                        {`https://<your-domain>${SMS_WEBHOOK_PATH}?token=${smsWebhookSecret || '<webhook secret above>'}`}
                        <CopyOutlined
                          style={{ marginLeft: 8, cursor: 'pointer' }}
                          onClick={() => navigator.clipboard.writeText(`${SMS_WEBHOOK_PATH}?token=${smsWebhookSecret || ''}`)}
                        />
                      </code>
                    </>
                  }
                />
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
      <Modal
        title={`Choose a ${pendingSignup?.channelType ?? ''} account`}
        open={Boolean(pendingSignup)}
        onCancel={() => { setPendingSignup(null); setSelectedCandidateId(null); }}
        onOk={handleConfirmCandidate}
        confirmLoading={confirming}
        okButtonProps={{ disabled: !selectedCandidateId }}
      >
        <Typography.Paragraph type="secondary">
          This login has access to more than one account. Pick the one you want to connect.
        </Typography.Paragraph>
        <Select
          style={{ width: '100%' }}
          placeholder="Select an account"
          value={selectedCandidateId}
          onChange={setSelectedCandidateId}
          showSearch
          optionFilterProp="label"
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          options={(pendingSignup?.candidates ?? []).map((c) => ({ value: c.id, label: c.displayName }))}
        />
      </Modal>

      <Modal
        title={`Edit ${editingAccount?.displayName ?? 'channel'}`}
        open={Boolean(editingAccount)}
        onCancel={() => setEditingAccount(null)}
        onOk={() => editForm.submit()}
        confirmLoading={savingEdit}
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveEdit}>
          <Form.Item name="displayName" label="Display name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {editingAccount && META_CHANNELS.includes(editingAccount.channelType) && (
            <>
              <Form.Item
                name="externalAccountId"
                label={META_PLATFORM_ID_FIELD[editingAccount.channelType].label}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              {editingAccount.channelType === 'WhatsApp' && (
                <Form.Item
                  name="externalWabaId"
                  label="WhatsApp Business Account ID"
                  tooltip="From WhatsApp > API Setup in Meta App Dashboard. Required to design and sync message templates."
                >
                  <Input placeholder="e.g. 105948015053410" />
                </Form.Item>
              )}
              <Form.Item name="accessToken" label="Access token">
                <Input.Password placeholder="Leave blank to keep the existing token" />
              </Form.Item>
              <Form.Item name="webhookSecret" label="Webhook verify token">
                <Input placeholder="Leave blank to keep the existing value" />
              </Form.Item>
            </>
          )}
          {editingAccount?.channelType === 'Email' && (
            <>
              <Form.Item name="externalAccountId" label="Mailbox address" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="accessToken" label="App password">
                <Input.Password placeholder="Leave blank to keep the existing password" />
              </Form.Item>
              <Form.Item name="smtpHost" label="SMTP host" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="smtpPort" label="SMTP port" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="imapHost" label="IMAP host" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="imapPort" label="IMAP port" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {editingAccount?.channelType === 'Sms' && (
            <>
              <Form.Item name="externalAccountId" label="From number" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="refreshToken" label="Account SID">
                <Input placeholder="Leave blank to keep the existing value" />
              </Form.Item>
              <Form.Item name="accessToken" label="Auth Token">
                <Input.Password placeholder="Leave blank to keep the existing token" />
              </Form.Item>
              <Form.Item name="webhookSecret" label="Webhook secret">
                <Input placeholder="Leave blank to keep the existing value" />
              </Form.Item>
            </>
          )}
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={['Active', 'Inactive'].map((s) => ({ value: s, label: s }))} />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}

const TEMPLATE_LANGUAGES = [
  { value: 'en_US', label: 'English (US)' },
  { value: 'en_GB', label: 'English (UK)' },
  { value: 'sw', label: 'Swahili' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt_BR', label: 'Portuguese (Brazil)' },
  { value: 'ar', label: 'Arabic' }
];
const TEMPLATE_CATEGORIES = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
const TEMPLATE_STATUS_COLORS = { APPROVED: 'green', PENDING: 'gold', REJECTED: 'red', PAUSED: 'orange', DISABLED: 'default' };

function TemplatesTab() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [channelAccounts, setChannelAccounts] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const selectedCategory = Form.useWatch('category', form);
  const isAuthentication = selectedCategory === 'AUTHENTICATION';

  useEffect(() => {
    getChannelAccounts()
      .then((accounts) => {
        const whatsAppAccounts = accounts.filter((a) => a.channelType === 'WhatsApp');
        setChannelAccounts(whatsAppAccounts);
        if (whatsAppAccounts.length) setSelectedChannelId(whatsAppAccounts[0].id);
      })
      .catch((err) => message.error(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = (channelId) => {
    if (!channelId) return;
    setLoading(true);
    getMessageTemplatesByChannel(channelId)
      .then(setTemplates)
      .catch((err) => message.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTemplates(selectedChannelId); }, [selectedChannelId]);

  const handleSync = async () => {
    if (!selectedChannelId) return;
    setSyncing(true);
    try {
      const result = await syncMessageTemplates(selectedChannelId);
      message.success(`Synced ${result.syncedCount} template(s) from Meta.`);
      loadTemplates(selectedChannelId);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      await createMessageTemplate({ channelAccountId: selectedChannelId, ...values });
      message.success('Template submitted to Meta for review.');
      setModalOpen(false);
      form.resetFields();
      loadTemplates(selectedChannelId);
    } catch (err) {
      message.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 150,
      render: (id) => (
        <Space style={{ whiteSpace: 'nowrap' }}>
          <Typography.Text code style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{id.slice(0, 8)}…</Typography.Text>
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            onClick={() => { navigator.clipboard.writeText(id); message.success('Template ID copied.'); }}
          />
        </Space>
      )
    },
    { title: 'Language', dataIndex: 'language' },
    { title: 'Category', dataIndex: 'category', render: (c) => <Tag>{c}</Tag> },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={TEMPLATE_STATUS_COLORS[s] ?? 'default'}>{s}</Tag> },
    { title: 'Body', dataIndex: 'bodyText', ellipsis: true }
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card>
          <Space wrap>
            <Typography.Text type="secondary">WhatsApp number:</Typography.Text>
            <Select
              style={{ minWidth: 260 }}
              placeholder="Connect a WhatsApp channel first"
              value={selectedChannelId}
              onChange={setSelectedChannelId}
              options={channelAccounts.map((a) => ({ value: a.id, label: `${a.displayName} (${a.externalAccountId})` }))}
            />
            <Button icon={<SyncOutlined />} loading={syncing} disabled={!selectedChannelId} onClick={handleSync}>
              Sync from Meta
            </Button>
            <Button type="primary" icon={<PlusOutlined />} disabled={!selectedChannelId} onClick={() => setModalOpen(true)}>
              New template
            </Button>
          </Space>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Templates">
          <Table rowKey="id" loading={loading} dataSource={templates} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: true }} />
        </Card>
      </Col>

      <Modal
        title="Design a new template"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={creating}
        width={640}
      >
        {isAuthentication ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="AUTHENTICATION templates are locked-wording OTP messages"
            description="Meta writes the body and adds a Copy Code button automatically — there's no free-text header, body, footer, or custom buttons here. You'll supply the actual code as the single variable when sending."
          />
        ) : (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="Meta reviews every template before it can be sent"
            description="Use {{1}}, {{2}}, ... in the body for variables filled in per message (e.g. customer name, order number). Header, footer, and buttons must stay static — variables there aren't supported yet."
          />
        )}
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Template name"
            tooltip="Lowercase letters, numbers, and underscores only — this is a permanent identifier, not shown to customers."
            rules={[{ required: true }, { pattern: /^[a-z0-9_]+$/, message: 'Lowercase letters, numbers, and underscores only.' }]}
          >
            <Input placeholder="order_confirmation" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="language" label="Language" rules={[{ required: true }]} initialValue="en_US">
                <Select options={TEMPLATE_LANGUAGES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]} initialValue="UTILITY">
                <Select options={TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
            </Col>
          </Row>
          {isAuthentication ? (
            <>
              <Form.Item name="addSecurityRecommendation" label="Add security recommendation" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
              <Form.Item name="codeExpirationMinutes" label="Code expires after (minutes, optional)">
                <InputNumber style={{ width: '100%' }} min={1} max={90} placeholder="e.g. 10" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="headerText" label="Header (optional)">
                <Input placeholder="e.g. Order Update" maxLength={60} />
              </Form.Item>
              <Form.Item name="bodyText" label="Body" rules={[{ required: true }]}>
                <Input.TextArea rows={4} placeholder="Hi {{1}}, your order {{2}} has shipped." maxLength={1024} />
              </Form.Item>
              <Form.Item name="footerText" label="Footer (optional)">
                <Input placeholder="e.g. Thank you for shopping with us" maxLength={60} />
              </Form.Item>
              <Form.Item name="quickReplyButtons" label="Quick reply buttons (optional, up to 3)">
                <Select mode="tags" open={false} placeholder="Type a button label and press enter" maxCount={3} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Row>
  );
}

function ApiKeysTab() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);

  const load = () => getApiKeys().then(setKeys);

  useEffect(() => { load().catch((err) => message.error(err.message)).finally(() => setLoading(false)); }, []);

  const handleCreate = async ({ name }) => {
    setCreating(true);
    try {
      const created = await createApiKey({ name });
      setRevealedKey(created);
      form.resetFields();
      await load();
    } catch (err) {
      message.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeApiKey(id);
      await load();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Key', dataIndex: 'keyPrefix', render: (v) => <Typography.Text code>{v}…</Typography.Text> },
    { title: 'Created', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString() },
    { title: 'Last used', dataIndex: 'lastUsedAt', render: (v) => (v ? new Date(v).toLocaleString() : 'Never') },
    { title: 'Status', key: 'status', render: (_, k) => <Tag color={k.revokedAt ? 'red' : 'green'}>{k.revokedAt ? 'Revoked' : 'Active'}</Tag> },
    {
      title: '', key: 'actions', width: 90,
      render: (_, k) => !k.revokedAt && (
        <Popconfirm title="Revoke this key? Any system using it will stop working immediately." onConfirm={() => handleRevoke(k.id)}>
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      )
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Alert
          type="info"
          showIcon
          title="For server-to-server integrations"
          description={
            <>
              <div>Use a key to let an external system (e.g. an OTP generator) send WhatsApp templates without an agent login. Send it as the <code>X-Api-Key</code> header on:</div>
              <code style={{ display: 'block', marginTop: 6 }}>POST /api/integrations/send-template</code>
              <div style={{ marginTop: 6 }}>{'Body: { "templateId": "...", "recipients": [{ "phoneNumber": "+2547...", "bodyParameters": ["482913"] }] }'}</div>
            </>
          }
        />
      </Col>
      <Col xs={24} md={8}>
        <Card title="Generate a new key">
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input placeholder="e.g. OTP service" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={creating} block>Generate key</Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card title="API keys">
          <Table rowKey="id" loading={loading} dataSource={keys} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: true }} />
        </Card>
      </Col>

      <Modal
        title="API key created"
        open={Boolean(revealedKey)}
        onCancel={() => setRevealedKey(null)}
        footer={<Button type="primary" onClick={() => setRevealedKey(null)}>Done</Button>}
      >
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} title="Copy this now — it won't be shown again." />
        <Space.Compact style={{ width: '100%' }}>
          <Input readOnly value={revealedKey?.key} />
          <Button icon={<CopyOutlined />} onClick={() => navigator.clipboard.writeText(revealedKey?.key ?? '')} />
        </Space.Compact>
      </Modal>
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
          { key: 'channels', label: 'Channels', children: <ChannelsTab /> },
          { key: 'templates', label: 'Message templates', children: <TemplatesTab /> },
          { key: 'apikeys', label: 'API keys', children: <ApiKeysTab /> }
        ]}
      />
    </>
  );
}
