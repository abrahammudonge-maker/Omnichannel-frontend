import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Table, Tag, Typography, App as AntApp } from 'antd';
import { createAdminOrganization, deleteAdminOrganization, getAdminOrganizations, updateAdminOrganization } from '../api';

const { Title, Paragraph } = Typography;
const STATUS_OPTIONS = ['Active', 'Suspended', 'Inactive'];

export function AdminOrganizationsPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [organizations, setOrganizations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const load = () => getAdminOrganizations().then(setOrganizations);

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createAdminOrganization(values);
      await load();
      message.success(`${values.name} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (organization) => { setEditing(organization); editForm.setFieldsValue(organization); };
  const saveEdit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      await updateAdminOrganization(editing.id, values);
      setEditing(null);
      await load();
      message.success('Organization updated.');
    } catch (err) { message.error(err.message); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    try { await deleteAdminOrganization(id); await load(); message.success('Organization removed.'); } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Country', dataIndex: 'country' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'Active' ? 'green' : 'default'}>{s}</Tag> },
    { title: 'Actions', render: (_, org) => <><Button type="link" onClick={() => edit(org)}>Edit</Button><Popconfirm title="Remove this organization?" onConfirm={() => remove(org.id)}><Button type="link" danger>Delete</Button></Popconfirm></> }
  ];

  return (
    <>
      <Title level={2}>Organizations</Title>
      <Paragraph type="secondary">Every tenant on the platform. Only platform super admins can see this.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add an organization">
            <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
              <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="country" label="Country" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add organization</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="All organizations">
            <Table rowKey="id" loading={loading} dataSource={organizations} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
      <Modal title="Edit organization" open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={saving}>
        <Form form={editForm} layout="vertical" autoComplete="off">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="country" label="Country" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
