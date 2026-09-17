import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Modal, Popconfirm, Row, Select, Table, Tag, Typography, App as AntApp } from 'antd';
import {
  createAdminConversation,
  deleteAdminConversation,
  getAdminConversations,
  getAdminCustomers,
  getAdminOrganizations,
  getAdminUsers,
  updateAdminConversation
} from '../api';

const { Title, Paragraph } = Typography;
const CHANNEL_OPTIONS = ['WhatsApp', 'FacebookMessenger', 'Instagram', 'Email', 'Sms'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const STATUS_COLORS = { Open: 'blue', 'In Progress': 'gold', Resolved: 'green', Closed: 'default' };

export function AdminConversationsPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [conversations, setConversations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const load = () => Promise.all([getAdminConversations(), getAdminOrganizations(), getAdminCustomers(), getAdminUsers()]).then(([conv, orgs, cust, u]) => {
    setConversations(conv);
    setOrganizations(orgs);
    setCustomers(cust);
    setUsers(u);
  });

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrgId = Form.useWatch('organizationId', form);
  const orgOptions = organizations.map((o) => ({ value: o.id, label: o.name }));
  const customerOptions = customers.filter((c) => c.organizationId === selectedOrgId).map((c) => ({ value: c.id, label: c.fullName }));
  const userOptions = users.filter((u) => u.organizationId === selectedOrgId).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }));

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createAdminConversation(values);
      await load();
      message.success('Conversation created.');
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (conversation) => { setEditing(conversation); editForm.setFieldsValue(conversation); };
  const saveEdit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      await updateAdminConversation(editing.id, values);
      setEditing(null);
      await load();
      message.success('Conversation updated.');
    } catch (err) { message.error(err.message); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    try { await deleteAdminConversation(id); await load(); message.success('Conversation removed.'); } catch (err) { message.error(err.message); }
  };

  const editUserOptions = editing ? users.filter((u) => u.organizationId === editing.organizationId).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })) : [];

  const orgFilters = useMemo(
    () => [...new Set(conversations.map((c) => c.organizationName))].sort().map((name) => ({ text: name, value: name })),
    [conversations]
  );

  const columns = [
    { title: 'Customer', dataIndex: 'customerName' },
    {
      title: 'Organization',
      dataIndex: 'organizationName',
      filters: orgFilters,
      onFilter: (value, record) => record.organizationName === value
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      render: (c) => <Tag>{c}</Tag>,
      filters: CHANNEL_OPTIONS.map((c) => ({ text: c, value: c })),
      onFilter: (value, record) => record.channel === value
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s) => <Tag color={STATUS_COLORS[s] ?? 'default'}>{s}</Tag>,
      filters: STATUS_OPTIONS.map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value
    },
    { title: 'Assigned to', dataIndex: 'assignedUserName', render: (v) => v || '—' },
    { title: 'Actions', render: (_, c) => <><Button type="link" onClick={() => edit(c)}>Edit</Button><Popconfirm title="Remove this conversation?" onConfirm={() => remove(c.id)}><Button type="link" danger>Delete</Button></Popconfirm></> }
  ];

  return (
    <>
      <Title level={2}>Conversations</Title>
      <Paragraph type="secondary">Every conversation across every organization on the platform.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a conversation">
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'Open' }} autoComplete="off">
              <Form.Item name="organizationId" label="Organization" rules={[{ required: true }]}>
                <Select options={orgOptions} showSearch optionFilterProp="label" placeholder="Select organization" onChange={() => form.setFieldsValue({ customerId: undefined, assignedUserId: undefined })} />
              </Form.Item>
              <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
                <Select options={customerOptions} showSearch optionFilterProp="label" placeholder="Select customer" disabled={!selectedOrgId} />
              </Form.Item>
              <Form.Item name="channel" label="Channel" rules={[{ required: true }]}>
                <Select options={CHANNEL_OPTIONS.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
              <Form.Item name="assignedUserId" label="Assigned agent">
                <Select options={userOptions} showSearch optionFilterProp="label" placeholder="Unassigned" allowClear disabled={!selectedOrgId} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Create conversation</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="All conversations">
            <Table rowKey="id" loading={loading} dataSource={conversations} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: true }} />
          </Card>
        </Col>
      </Row>
      <Modal title="Edit conversation" open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={saving}>
        <Form form={editForm} layout="vertical" autoComplete="off">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="assignedUserId" label="Assigned agent">
            <Select options={editUserOptions} showSearch optionFilterProp="label" placeholder="Unassigned" allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
