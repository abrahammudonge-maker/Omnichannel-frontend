import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Table, Typography, App as AntApp } from 'antd';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../api';

const { Title, Paragraph } = Typography;

export function CustomersPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [customers, setCustomers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const load = () => getCustomers().then(setCustomers);

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createCustomer(values);
      await load();
      message.success(`${values.fullName} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const beginEdit = (customer) => {
    setEditing(customer);
    editForm.setFieldsValue(customer);
  };

  const saveEdit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      await updateCustomer(editing.id, values);
      setEditing(null);
      await load();
      message.success('Customer updated.');
    } catch (err) {
      message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteCustomer(id);
      await load();
      message.success('Customer removed.');
    } catch (err) {
      message.error(err.message);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchText.trim()) return customers;
    const needle = searchText.trim().toLowerCase();
    return customers.filter((c) =>
      [c.fullName, c.email, c.phone, c.whatsAppNumber, c.facebookId, c.instagramId]
        .some((field) => field?.toLowerCase().includes(needle))
    );
  }, [customers, searchText]);

  const columns = [
    { title: 'Name', dataIndex: 'fullName' },
    { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
    { title: 'Phone', dataIndex: 'phone', render: (v) => v || '—' },
    { title: 'WhatsApp', dataIndex: 'whatsAppNumber', render: (v) => v || '—' },
    { title: 'Facebook', dataIndex: 'facebookId', render: (v) => v || '—' },
    { title: 'Instagram', dataIndex: 'instagramId', render: (v) => v || '—' },
    { title: 'Added', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString() }
    , { title: 'Actions', render: (_, customer) => <><Button type="link" onClick={() => beginEdit(customer)}>Edit</Button><Popconfirm title="Remove this customer? Existing conversations may prevent deletion." onConfirm={() => remove(customer.id)}><Button type="link" danger>Delete</Button></Popconfirm></> }
  ];

  return (
    <>
      <Title level={2}>Customers</Title>
      <Paragraph type="secondary">
        The people your organization supports across every channel. Add at least one contact method per customer — conversations can only send real messages using the details on file here.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a customer">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email"><Input type="email" placeholder="For the Email channel" /></Form.Item>
              <Form.Item name="phone" label="Phone"><Input placeholder="For the SMS channel" /></Form.Item>
              <Form.Item name="whatsAppNumber" label="WhatsApp number"><Input placeholder="e.g. +254712345678" /></Form.Item>
              <Form.Item name="facebookId" label="Facebook ID"><Input placeholder="Facebook Messenger PSID" /></Form.Item>
              <Form.Item name="instagramId" label="Instagram ID"><Input placeholder="Instagram-scoped ID" /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add customer</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Customers">
            <Input.Search
              placeholder="Search by name, email, phone, or ID"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16, maxWidth: 360 }}
            />
            <Table rowKey="id" loading={loading} dataSource={filteredCustomers} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: true }} />
          </Card>
        </Col>
      </Row>
      <Modal title="Edit customer" open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={saving}>
        <Form form={editForm} layout="vertical">
          <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input type="email" /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="whatsAppNumber" label="WhatsApp"><Input /></Form.Item>
          <Form.Item name="facebookId" label="Facebook ID"><Input /></Form.Item>
          <Form.Item name="instagramId" label="Instagram ID"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
