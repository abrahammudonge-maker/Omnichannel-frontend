import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Switch, Table, Tag, Typography, App as AntApp } from 'antd';
import { createAdminDepartment, deleteAdminDepartment, getAdminDepartments, getAdminOrganizations, updateAdminDepartment } from '../api';

const { Title, Paragraph } = Typography;

export function AdminDepartmentsPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const load = () => Promise.all([getAdminDepartments(), getAdminOrganizations()]).then(([d, orgs]) => {
    setDepartments(d);
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
      await createAdminDepartment(values);
      await load();
      message.success(`${values.name} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (department) => { setEditing(department); editForm.setFieldsValue(department); };
  const saveEdit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      await updateAdminDepartment(editing.id, values);
      setEditing(null);
      await load();
      message.success('Department updated.');
    } catch (err) { message.error(err.message); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    try { await deleteAdminDepartment(id); await load(); message.success('Department removed.'); } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Organization', dataIndex: 'organizationName' },
    { title: 'Description', dataIndex: 'description', render: (v) => v || '—' },
    { title: 'Active', dataIndex: 'isActive', render: (a) => <Tag color={a ? 'green' : 'default'}>{a ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Actions', render: (_, d) => <><Button type="link" onClick={() => edit(d)}>Edit</Button><Popconfirm title="Remove this department?" onConfirm={() => remove(d.id)}><Button type="link" danger>Delete</Button></Popconfirm></> }
  ];

  return (
    <>
      <Title level={2}>Departments</Title>
      <Paragraph type="secondary">Every department across every organization on the platform.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a department">
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true }} autoComplete="off">
              <Form.Item name="organizationId" label="Organization" rules={[{ required: true }]}>
                <Select options={orgOptions} showSearch optionFilterProp="label" placeholder="Select organization" />
              </Form.Item>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="description" label="Description"><Input.TextArea autoComplete="off" rows={2} /></Form.Item>
              <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add department</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="All departments">
            <Table rowKey="id" loading={loading} dataSource={departments} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
      <Modal title="Edit department" open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={saving}>
        <Form form={editForm} layout="vertical" autoComplete="off">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea autoComplete="off" rows={2} /></Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
