import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Table, Typography, App as AntApp } from 'antd';
import { createAdminOrganizationSetting, deleteAdminOrganizationSetting, getAdminOrganizationSettings, getAdminOrganizations, updateAdminOrganizationSetting } from '../api';

const { Title, Paragraph } = Typography;

export function AdminOrganizationSettingsPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [settings, setSettings] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const load = () => Promise.all([getAdminOrganizationSettings(), getAdminOrganizations()]).then(([s, orgs]) => {
    setSettings(s);
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
      await createAdminOrganizationSetting(values);
      await load();
      message.success(`${values.settingName} added.`);
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (setting) => { setEditing(setting); editForm.setFieldsValue(setting); };
  const saveEdit = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    try {
      await updateAdminOrganizationSetting(editing.id, values);
      setEditing(null);
      await load();
      message.success('Setting updated.');
    } catch (err) { message.error(err.message); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    try { await deleteAdminOrganizationSetting(id); await load(); message.success('Setting removed.'); } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: 'Organization', dataIndex: 'organizationName' },
    { title: 'Key', dataIndex: 'settingName' },
    { title: 'Value', dataIndex: 'settingValue' },
    { title: 'Actions', render: (_, s) => <><Button type="link" onClick={() => edit(s)}>Edit</Button><Popconfirm title="Remove this setting?" onConfirm={() => remove(s.id)}><Button type="link" danger>Delete</Button></Popconfirm></> }
  ];

  return (
    <>
      <Title level={2}>Organization Settings</Title>
      <Paragraph type="secondary">Every custom setting across every organization on the platform.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a setting">
            <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
              <Form.Item name="organizationId" label="Organization" rules={[{ required: true }]}>
                <Select options={orgOptions} showSearch optionFilterProp="label" placeholder="Select organization" />
              </Form.Item>
              <Form.Item name="settingName" label="Key" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item name="settingValue" label="Value" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add setting</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="All settings">
            <Table rowKey="id" loading={loading} dataSource={settings} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
      <Modal title="Edit setting" open={Boolean(editing)} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={saving}>
        <Form form={editForm} layout="vertical" autoComplete="off">
          <Form.Item name="settingName" label="Key" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="settingValue" label="Value" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
