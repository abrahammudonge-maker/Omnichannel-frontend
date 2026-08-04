import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Popconfirm, Row, Select, Table, Tag, Typography, App as AntApp } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { createTeam, deleteTeam, getDepartments, getTeams, getUsers } from '../api';

const { Title, Paragraph } = Typography;

export function TeamsPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([getTeams(), getDepartments(), getUsers()])
    .then(([teamData, departmentData, userData]) => {
      setTeams(teamData);
      setDepartments(departmentData);
      setUsers(userData);
    });

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentNameById = useMemo(() => {
    const map = new Map();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const userNameById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.id, `${u.firstName} ${u.lastName}`));
    return map;
  }, [users]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createTeam({ ...values, leaderId: values.leaderId || null });
      await load();
      message.success(`${values.name} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTeam(id);
      await load();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Department', dataIndex: 'departmentId', render: (id) => <Tag>{departmentNameById.get(id) ?? 'Unknown'}</Tag> },
    { title: 'Leader', dataIndex: 'leaderId', render: (id) => id ? userNameById.get(id) ?? 'Unknown' : '—' },
    {
      title: '', key: 'actions', width: 60,
      render: (_, t) => (
        <Popconfirm title="Delete this team?" onConfirm={() => handleDelete(t.id)}>
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      )
    }
  ];

  return (
    <>
      <Title level={2}>Teams</Title>
      <Paragraph type="secondary">Teams live inside a department and can have a leader assigned from your users.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a team">
            {!loading && departments.length === 0 && (
              <Alert type="warning" showIcon style={{ marginBottom: 16 }} title="Create a department first." />
            )}
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
                <Select options={departments.map((d) => ({ value: d.id, label: d.name }))} />
              </Form.Item>
              <Form.Item name="leaderId" label="Team leader">
                <Select allowClear placeholder="None" options={users.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))} />
              </Form.Item>
              <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} disabled={departments.length === 0} block>Add team</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Teams">
            <Table rowKey="id" loading={loading} dataSource={teams} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
