import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Switch, Table, Tag, Typography, App as AntApp } from 'antd';
import { createAdminUser, deleteAdminUser, getAdminOrganizations, getAdminUsers, updateAdminUser } from '../api';

const { Title, Paragraph } = Typography;
const ROLE_OPTIONS = ['PlatformSuperAdmin', 'OrganizationAdmin', 'Supervisor', 'Agent', 'Viewer'];
const ROLE_LABELS = { PlatformSuperAdmin: 'Platform Super Admin', OrganizationAdmin: 'Organization Admin', Supervisor: 'Supervisor', Agent: 'Agent', Viewer: 'Viewer' };

export function AdminUsersPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const load = () => Promise.all([getAdminUsers(), getAdminOrganizations()]).then(([u, orgs]) => {
    setUsers(u);
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
      await createAdminUser(values);
      await load();
      message.success(`${values.firstName} ${values.lastName} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (user) => { setEditing(user); editForm.setFieldsValue({ ...user, password: '' }); };
  const saveEdit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      await updateAdminUser(editing.id, values);
      setEditing(null);
      await load();
      message.success('User updated.');
    } catch (err) { message.error(err.message); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    try { await deleteAdminUser(id); await load(); message.success('User removed.'); } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: 'Name', render: (_, u) => `${u.firstName} ${u.lastName}` },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Organization', dataIndex: 'organizationName' },
    { title: 'Role', dataIndex: 'role', render: (r) => <Tag color="blue">{ROLE_LABELS[r] ?? r}</Tag> },
    { title: 'Status', dataIndex: 'isActive', render: (a) => <Tag color={a ? 'green' : 'default'}>{a ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Actions', render: (_, user) => <><Button type="link" onClick={() => edit(user)}>Edit</Button><Popconfirm title="Remove this user?" onConfirm={() => remove(user.id)}><Button type="link" danger>Delete</Button></Popconfirm></> }
  ];

  return (
    <>
      <Title level={2}>All Users</Title>
      <Paragraph type="secondary">Every user across every organization on the platform. Only platform super admins can see this.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a user">
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ role: 'Agent' }} autoComplete="off">
              <Form.Item name="organizationId" label="Organization" rules={[{ required: true }]}>
                <Select options={orgOptions} showSearch optionFilterProp="label" placeholder="Select organization" />
              </Form.Item>
              <Form.Item name="firstName" label="First name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="lastName" label="Last name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="password" label="Temporary password" rules={[{ required: true, min: 6 }]}><Input.Password autoComplete="new-password" /></Form.Item>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add user</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Platform users">
            <Table rowKey="id" loading={loading} dataSource={users} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
      <Modal title="Edit user" open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={saving}>
        <Form form={editForm} layout="vertical" autoComplete="off">
          <Form.Item name="firstName" label="First name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="lastName" label="Last name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="password" label="New password"><Input.Password autoComplete="new-password" placeholder="Leave blank to keep current password" /></Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}><Select options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} /></Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
