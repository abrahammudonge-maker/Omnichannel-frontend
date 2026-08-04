import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Form, Input, Row, Select, Statistic, Table, Tag, Typography, App as AntApp } from 'antd';
import { addInternalNote, createConversation, createCustomer, getConversations, getCustomers } from '../api';

const { Title, Paragraph } = Typography;
const CHANNEL_LABELS = { 1: 'WhatsApp', 2: 'Facebook Messenger', 3: 'Instagram', 4: 'Email', 5: 'SMS' };
const CHANNEL_OPTIONS = ['WhatsApp', 'FacebookMessenger', 'Instagram', 'Email', 'Sms'];

export function ConversationsPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [conversations, setConversations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = () => Promise.all([getConversations(), getCustomers()]).then(([conversationData, customerData]) => {
    setConversations(conversationData);
    setCustomers(customerData);
  });

  useEffect(() => {
    loadData().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customerNameById = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c.fullName));
    return map;
  }, [customers]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const customerId = await createCustomer({ fullName: values.customer });
      const conversationId = await createConversation({ customerId, channel: values.channel });
      if (values.note?.trim()) {
        await addInternalNote({ conversationId, body: values.note.trim() });
      }
      await loadData();
      message.success(`Case created for ${values.customer} on ${values.channel}.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Customer', dataIndex: 'customerId', render: (id) => customerNameById.get(id) ?? id },
    { title: 'Channel', dataIndex: 'channel', render: (c) => <Tag>{CHANNEL_LABELS[c] ?? 'Unknown'}</Tag> },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Open' ? 'blue' : 'default'}>{s}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleString() }
  ];

  return (
    <>
      <Title level={2}>Conversations</Title>
      <Paragraph type="secondary">Live view of every conversation in your organization.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Statistic title="Open tickets" value={conversations.filter((c) => c.status === 'Open').length} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Total conversations" value={conversations.length} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Customers" value={customers.length} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={9}>
          <Card title="Launch a new conversation">
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ channel: 'Email' }}>
              <Form.Item name="customer" label="Customer name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Alicia Chen" />
              </Form.Item>
              <Form.Item name="channel" label="Channel" rules={[{ required: true }]}>
                <Select options={CHANNEL_OPTIONS.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
              <Form.Item name="note" label="Context note">
                <Input.TextArea rows={3} placeholder="Optional internal note" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Create case</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={15}>
          <Card title="Conversations">
            <Table
              rowKey="id"
              loading={loading}
              dataSource={conversations}
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
