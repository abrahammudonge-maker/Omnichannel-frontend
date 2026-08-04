import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Select, Table, Tag, Typography, App as AntApp } from 'antd';
import { createUser, getUsers } from '../api';

const { Title, Paragraph } = Typography;
const ROLE_OPTIONS = ['PlatformSuperAdmin', 'OrganizationAdmin', 'Supervisor', 'Agent', 'Viewer'];
const ROLE_LABELS = { 1: 'Platform Super Admin', 2: 'Organization Admin', 3: 'Supervisor', 4: 'Agent', 5: 'Viewer' };

export function UsersPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => getUsers().then(setUsers);

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createUser(values);
      await load();
      message.success(`${values.firstName} ${values.lastName} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Name', render: (_, u) => `${u.firstName} ${u.lastName}` },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Role', dataIndex: 'role', render: (r) => <Tag color="blue">{ROLE_LABELS[r] ?? r}</Tag> },
    { title: 'Status', dataIndex: 'isActive', render: (a) => <Tag color={a ? 'green' : 'default'}>{a ? 'Active' : 'Inactive'}</Tag> }
  ];

  return (
    <>
      <Title level={2}>Users</Title>
      <Paragraph type="secondary">Agents, supervisors, and admins in your organization. New users can sign in immediately with the password you set here.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a team member">
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ role: 'Agent' }}>
              <Form.Item name="firstName" label="First name" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="lastName" label="Last name" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
              <Form.Item name="password" label="Temporary password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add user</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Team members">
            <Table rowKey="id" loading={loading} dataSource={users} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
