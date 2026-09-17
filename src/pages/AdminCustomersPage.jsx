import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Table, Typography, App as AntApp } from 'antd';
import { createAdminCustomer, deleteAdminCustomer, getAdminCustomers, getAdminOrganizations, updateAdminCustomer } from '../api';

const { Title, Paragraph } = Typography;

export function AdminCustomersPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [customers, setCustomers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const load = () => Promise.all([getAdminCustomers(), getAdminOrganizations()]).then(([c, orgs]) => {
    setCustomers(c);
    setOrganizations(orgs);
  });

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orgOptions = organizations.map((o) => ({ value: o.id, label: o.name }));

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createAdminCustomer(values);
      await load();
      message.success(`${values.fullName} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (customer) => { setEditing(customer); editForm.setFieldsValue(customer); };
  const saveEdit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      await updateAdminCustomer(editing.id, values);
      setEditing(null);
      await load();
      message.success('Customer updated.');
    } catch (err) { message.error(err.message); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    try { await deleteAdminCustomer(id); await load(); message.success('Customer removed.'); } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: 'Name', dataIndex: 'fullName' },
    { title: 'Organization', dataIndex: 'organizationName' },
    { title: 'Phone', dataIndex: 'phone', render: (v) => v || '—' },
    { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
    { title: 'Actions', render: (_, c) => <><Button type="link" onClick={() => edit(c)}>Edit</Button><Popconfirm title="Remove this customer?" onConfirm={() => remove(c.id)}><Button type="link" danger>Delete</Button></Popconfirm></> }
  ];

  return (
    <>
      <Title level={2}>Customers</Title>
      <Paragraph type="secondary">Every customer across every organization on the platform.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a customer">
            <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
              <Form.Item name="organizationId" label="Organization" rules={[{ required: true }]}>
                <Select options={orgOptions} showSearch optionFilterProp="label" placeholder="Select organization" />
              </Form.Item>
              <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="phone" label="Phone"><Input autoComplete="off" /></Form.Item>
              <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="facebookId" label="Facebook ID"><Input autoComplete="off" /></Form.Item>
              <Form.Item name="instagramId" label="Instagram ID"><Input autoComplete="off" /></Form.Item>
              <Form.Item name="whatsAppNumber" label="WhatsApp number"><Input autoComplete="off" /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add customer</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="All customers">
            <Table rowKey="id" loading={loading} dataSource={customers} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
      <Modal title="Edit customer" open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={saving}>
        <Form form={editForm} layout="vertical" autoComplete="off">
          <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input autoComplete="off" /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="facebookId" label="Facebook ID"><Input autoComplete="off" /></Form.Item>
          <Form.Item name="instagramId" label="Instagram ID"><Input autoComplete="off" /></Form.Item>
          <Form.Item name="whatsAppNumber" label="WhatsApp number"><Input autoComplete="off" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
