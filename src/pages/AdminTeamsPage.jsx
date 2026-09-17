import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Switch, Table, Tag, Typography, App as AntApp } from 'antd';
import { createAdminTeam, deleteAdminTeam, getAdminDepartments, getAdminOrganizations, getAdminTeams, getAdminUsers, updateAdminTeam } from '../api';

const { Title, Paragraph } = Typography;

export function AdminTeamsPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [teams, setTeams] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const load = () => Promise.all([getAdminTeams(), getAdminOrganizations(), getAdminDepartments(), getAdminUsers()]).then(([t, orgs, deps, u]) => {
    setTeams(t);
    setOrganizations(orgs);
    setDepartments(deps);
    setUsers(u);
  });

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrgId = Form.useWatch('organizationId', form);
  const orgOptions = organizations.map((o) => ({ value: o.id, label: o.name }));
  const departmentOptions = departments.filter((d) => d.organizationId === selectedOrgId).map((d) => ({ value: d.id, label: d.name }));
  const leaderOptions = users.filter((u) => u.organizationId === selectedOrgId).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }));

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createAdminTeam(values);
      await load();
      message.success(`${values.name} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (team) => { setEditing(team); editForm.setFieldsValue(team); };
  const saveEdit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      await updateAdminTeam(editing.id, values);
      setEditing(null);
      await load();
      message.success('Team updated.');
    } catch (err) { message.error(err.message); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    try { await deleteAdminTeam(id); await load(); message.success('Team removed.'); } catch (err) { message.error(err.message); }
  };

  const editDepartmentOptions = editing ? departments.filter((d) => d.organizationId === editing.organizationId).map((d) => ({ value: d.id, label: d.name })) : [];
  const editLeaderOptions = editing ? users.filter((u) => u.organizationId === editing.organizationId).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })) : [];

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Organization', dataIndex: 'organizationName' },
    { title: 'Department', dataIndex: 'departmentName' },
    { title: 'Leader', dataIndex: 'leaderName', render: (v) => v || '—' },
    { title: 'Active', dataIndex: 'isActive', render: (a) => <Tag color={a ? 'green' : 'default'}>{a ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Actions', render: (_, t) => <><Button type="link" onClick={() => edit(t)}>Edit</Button><Popconfirm title="Remove this team?" onConfirm={() => remove(t.id)}><Button type="link" danger>Delete</Button></Popconfirm></> }
  ];

  return (
    <>
      <Title level={2}>Teams</Title>
      <Paragraph type="secondary">Every team across every organization on the platform.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a team">
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true }} autoComplete="off">
              <Form.Item name="organizationId" label="Organization" rules={[{ required: true }]}>
                <Select options={orgOptions} showSearch optionFilterProp="label" placeholder="Select organization" onChange={() => form.setFieldsValue({ departmentId: undefined, leaderId: undefined })} />
              </Form.Item>
              <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
                <Select options={departmentOptions} showSearch optionFilterProp="label" placeholder="Select department" disabled={!selectedOrgId} />
              </Form.Item>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="description" label="Description"><Input.TextArea autoComplete="off" rows={2} /></Form.Item>
              <Form.Item name="leaderId" label="Leader">
                <Select options={leaderOptions} showSearch optionFilterProp="label" placeholder="No leader" allowClear disabled={!selectedOrgId} />
              </Form.Item>
              <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add team</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="All teams">
            <Table rowKey="id" loading={loading} dataSource={teams} columns={columns} pagination={{ pageSize: 8 }} scroll={{ x: true }} />
          </Card>
        </Col>
      </Row>
      <Modal title="Edit team" open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={saving}>
        <Form form={editForm} layout="vertical" autoComplete="off">
          <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
            <Select options={editDepartmentOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea autoComplete="off" rows={2} /></Form.Item>
          <Form.Item name="leaderId" label="Leader">
            <Select options={editLeaderOptions} showSearch optionFilterProp="label" placeholder="No leader" allowClear />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
