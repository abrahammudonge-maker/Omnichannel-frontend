import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Col, Form, Input, Modal, Radio, Row, Select, Space, Statistic, Table, Tag, App as AntApp } from 'antd';
import { addInternalNote, createConversation, createCustomer, getAllMessages, getChannelAccounts, getConversations, getCustomers } from '../api';
import { ChannelBadge, PageHeader, PersonAvatar } from '../components/ui';

const { Title, Paragraph, Text } = Typography;
const CHANNEL_LABELS = { 1: 'WhatsApp', 2: 'Facebook Messenger', 3: 'Instagram', 4: 'Email', 5: 'SMS', 6: 'Voice' };
const CHANNEL_COLORS = { 1: 'green', 2: 'blue', 3: 'magenta', 4: 'geekblue', 5: 'orange', 6: 'purple' };
const INBOX_TABS = [
  { key: 'all', label: 'All inboxes' },
  { key: '1', label: 'WhatsApp' },
  { key: '2', label: 'Messenger' },
  { key: '3', label: 'Instagram' },
  { key: '4', label: 'Email' },
  { key: '5', label: 'SMS' },
  { key: '6', label: 'Voice' }
];
const CHANNEL_OPTIONS = ['WhatsApp', 'FacebookMessenger', 'Instagram', 'Email', 'Sms'];
const CHANNEL_FIELD = {
  Email: { key: 'email', label: 'Email address', placeholder: 'customer@example.com', type: 'email' },
  Sms: { key: 'phone', label: 'Phone number', placeholder: '+254712345678' },
  WhatsApp: { key: 'whatsAppNumber', label: 'WhatsApp number', placeholder: '+254712345678' },
  FacebookMessenger: { key: 'facebookId', label: 'Facebook ID', placeholder: 'Facebook Messenger PSID' },
  Instagram: { key: 'instagramId', label: 'Instagram ID', placeholder: 'Instagram-scoped ID' }
};
const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const REFRESH_INTERVAL_MS = 20000;

export function ConversationsPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [conversations, setConversations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [channelAccounts, setChannelAccounts] = useState([]);
  const [lastActivityById, setLastActivityById] = useState(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const channel = Form.useWatch('channel', form) ?? 'Email';
  const customerMode = Form.useWatch('customerMode', form) ?? 'existing';
  const fieldConfig = CHANNEL_FIELD[channel];

  const accountsForChannel = useMemo(
    () => channelAccounts.filter((a) => a.channelType === channel && a.status === 'Active'),
    [channelAccounts, channel]
  );

  const loadData = () => Promise.all([getConversations(), getCustomers(), getAllMessages(), getChannelAccounts()]).then(([conversationData, customerData, messageData, channelAccountData]) => {
    setChannelAccounts(channelAccountData);
    const activityMap = new Map();
    messageData.forEach((m) => {
      const existing = activityMap.get(m.conversationId);
      if (!existing || new Date(m.sentAt) > new Date(existing)) {
        activityMap.set(m.conversationId, m.sentAt);
      }
    });

    const sorted = [...conversationData].sort((a, b) => {
      const aTime = new Date(activityMap.get(a.id) ?? a.createdAt);
      const bTime = new Date(activityMap.get(b.id) ?? b.createdAt);
      return bTime - aTime;
    });

    setConversations(sorted);
    setCustomers(customerData);
    setLastActivityById(activityMap);
  });

  useEffect(() => {
    loadData().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    const interval = setInterval(() => {
      loadData().catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customerNameById = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c.fullName));
    return map;
  }, [customers]);

  const customerOptions = useMemo(() => customers.map((c) => {
    const contactValue = c[fieldConfig.key];
    return {
      value: c.id,
      searchText: `${c.fullName} ${c.email ?? ''} ${c.phone ?? ''} ${c.whatsAppNumber ?? ''}`,
      label: (
        <span>
          {c.fullName}{' '}
          <Text type={contactValue ? 'secondary' : 'danger'} style={{ fontSize: 12 }}>
            {contactValue ? `— ${contactValue}` : `— no ${fieldConfig.label.toLowerCase()} on file`}
          </Text>
        </span>
      )
    };
  }), [customers, fieldConfig]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      let customerId;
      let customerLabel;

      if (values.customerMode === 'new') {
        customerId = await createCustomer({ fullName: values.newCustomerName, [fieldConfig.key]: values.contactValue });
        customerLabel = values.newCustomerName;
      } else {
        const existing = customers.find((c) => c.id === values.customerId);
        if (!existing) {
          message.error('Select a customer.');
          setSubmitting(false);
          return;
        }
        if (!existing[fieldConfig.key]) {
          message.error(`${existing.fullName} has no ${fieldConfig.label.toLowerCase()} on file. Add one on the Customers page, or create a new customer here instead.`);
          setSubmitting(false);
          return;
        }
        customerId = existing.id;
        customerLabel = existing.fullName;
      }

      const conversationId = await createConversation({ customerId, channel: values.channel, channelAccountId: values.channelAccountId ?? null });
      if (values.note?.trim()) {
        await addInternalNote({ conversationId, body: values.note.trim() });
      }
      await loadData();
      message.success(`Case created for ${customerLabel} on ${values.channel}.`);
      setNewOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const [searchText, setSearchText] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeInbox = INBOX_TABS.some((t) => t.key === searchParams.get('inbox')) ? searchParams.get('inbox') : 'all';

  const inboxCounts = useMemo(() => {
    const counts = {};
    INBOX_TABS.forEach((t) => { counts[t.key] = { total: 0, open: 0 }; });
    conversations.forEach((c) => {
      const isOpen = c.status === 'Open';
      counts.all.total += 1;
      if (isOpen) counts.all.open += 1;
      const key = String(c.channel);
      if (counts[key]) {
        counts[key].total += 1;
        if (isOpen) counts[key].open += 1;
      }
    });
    return counts;
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const inboxFiltered = activeInbox === 'all'
      ? conversations
      : conversations.filter((c) => String(c.channel) === activeInbox);
    if (!searchText.trim()) return inboxFiltered;
    const needle = searchText.trim().toLowerCase();
    return inboxFiltered.filter((c) => (customerNameById.get(c.customerId) ?? '').toLowerCase().includes(needle));
  }, [conversations, customerNameById, searchText, activeInbox]);


  const selectInbox = (key) => {
    setSearchParams(key === 'all' ? {} : { inbox: key });
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'customerId',
      render: (id) => (
        <Space>
          <PersonAvatar name={customerNameById.get(id) ?? '?'} size={28} />
          {customerNameById.get(id) ?? id}
        </Space>
      )
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      render: (c) => <ChannelBadge channel={c} />,
      filters: Object.entries(CHANNEL_LABELS).map(([value, text]) => ({ text, value: Number(value) })),
      onFilter: (value, record) => record.channel === value
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => <Tag color={s === 'Open' ? 'blue' : 'default'}>{s}</Tag>,
      filters: STATUS_OPTIONS.map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Last activity',
      key: 'lastActivity',
      render: (_, c) => new Date(lastActivityById.get(c.id) ?? c.createdAt).toLocaleString()
    }
  ];

  return (
    <>
      <PageHeader
        title="Conversations"
        subtitle="Every customer conversation, newest activity first."
        actions={<Button type="primary" onClick={() => setNewOpen(true)}>New conversation</Button>}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Statistic title="Open tickets" value={conversations.filter((c) => c.status === 'Open').length} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Total conversations" value={conversations.length} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Customers" value={customers.length} /></Card></Col>
      </Row>

      <Modal title="Start a conversation" open={newOpen} onCancel={() => setNewOpen(false)} footer={null} destroyOnHidden>
        <div>
          <div>
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ channel: 'Email', customerMode: 'existing' }}>
              <Form.Item name="channel" label="Channel" rules={[{ required: true }]}>
                <Select
                  options={CHANNEL_OPTIONS.map((c) => ({ value: c, label: c }))}
                  onChange={() => form.setFieldsValue({ contactValue: undefined, channelAccountId: undefined })}
                />
              </Form.Item>

              {accountsForChannel.length > 1 && (
                <Form.Item
                  name="channelAccountId"
                  label="Send from"
                  rules={[{ required: true, message: `Select which connected ${channel} account to use.` }]}
                  tooltip="Your organization has more than one connected account for this channel — pick which one this conversation should use."
                >
                  <Select
                    placeholder="Select an account"
                    options={accountsForChannel.map((a) => ({ value: a.id, label: `${a.displayName} (${a.externalAccountId})` }))}
                  />
                </Form.Item>
              )}

              <Form.Item name="customerMode">
                <Radio.Group optionType="button" block>
                  <Radio.Button value="existing">Existing customer</Radio.Button>
                  <Radio.Button value="new">New customer</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {customerMode === 'existing' ? (
                <Form.Item name="customerId" label="Customer" rules={[{ required: true, message: 'Select a customer.' }]}>
                  <Select
                    showSearch
                    placeholder="Search by name, email, or phone"
                    optionFilterProp="searchText"
                    options={customerOptions}
                    notFoundContent={customers.length ? 'No match.' : 'No customers yet — switch to "New customer".'}
                  />
                </Form.Item>
              ) : (
                <>
                  <Form.Item name="newCustomerName" label="Customer name" rules={[{ required: true }]}>
                    <Input placeholder="e.g. Alicia Chen" />
                  </Form.Item>
                  <Form.Item
                    key={fieldConfig.key}
                    name="contactValue"
                    label={fieldConfig.label}
                    rules={[{ required: true, type: fieldConfig.type, message: `${fieldConfig.label} is required to reach this customer on ${channel}.` }]}
                  >
                    <Input placeholder={fieldConfig.placeholder} />
                  </Form.Item>
                </>
              )}

              <Form.Item
                name="note"
                label="Internal note (optional)"
                tooltip="Visible to your team only — never sent to the customer. To message the customer, open the conversation after creating it and use the reply box there."
              >
                <Input.TextArea rows={3} placeholder="Staff-only context — not sent to the customer" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Create case</Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Modal>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card>
            <Space wrap style={{ marginBottom: 16 }}>
              {INBOX_TABS.map((t) => (
                <Button
                  key={t.key}
                  shape="round"
                  type={activeInbox === t.key ? 'primary' : 'default'}
                  onClick={() => selectInbox(t.key)}
                >
                  {t.label} · {inboxCounts[t.key].total}
                  {inboxCounts[t.key].open > 0 ? ` · ${inboxCounts[t.key].open} open` : ''}
                </Button>
              ))}
            </Space>
            <Input.Search
              placeholder="Search by customer name"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16, maxWidth: 320 }}
            />
            <Table
              rowKey="id"
              loading={loading}
              dataSource={filteredConversations}
              columns={columns}
              pagination={{ pageSize: 8 }}
              onRow={(record) => ({ onClick: () => navigate(`/conversations/${record.id}`), style: { cursor: 'pointer' } })}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
