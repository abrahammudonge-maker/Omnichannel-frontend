import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Form, Input, Popconfirm, Row, Select, Table, Tabs, Tag, Typography, App as AntApp } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import {
  createChannelAccount,
  createOrganizationSetting,
  deleteChannelAccount,
  deleteOrganizationSetting,
  getChannelAccounts,
  getCurrentUser,
  getOrganizationById,
  getOrganizationSettings
} from '../api';

const CHANNEL_TYPES = ['WhatsApp', 'FacebookMessenger', 'Instagram', 'Email', 'Sms'];

function ProfileTab() {
  const currentUser = getCurrentUser();
  const { message } = AntApp.useApp();
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    if (!currentUser?.organizationId) return;
    getOrganizationById(currentUser.organizationId).then(setOrganization).catch((err) => message.error(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!organization) return <Card loading />;

  return (
    <Card title={organization.name}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Email">{organization.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{organization.phone}</Descriptions.Item>
        <Descriptions.Item label="Country">{organization.country}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color="green">{organization.status}</Tag></Descriptions.Item>
        <Descriptions.Item label="Created">{new Date(organization.createdAt).toLocaleString()}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

function CustomSettingsTab() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [settings, setSettings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => getOrganizationSettings().then(setSettings);

  useEffect(() => { load().catch((err) => message.error(err.message)).finally(() => setLoading(false)); }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createOrganizationSetting(values);
      await load();
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOrganizationSetting(id);
      await load();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Key', dataIndex: 'settingName' },
    { title: 'Value', dataIndex: 'settingValue' },
    {
      title: '', key: 'actions', width: 60,
      render: (_, s) => (
        <Popconfirm title="Delete this setting?" onConfirm={() => handleDelete(s.id)}>
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      )
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="Add a setting">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="settingName" label="Key" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="settingValue" label="Value" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>Add setting</Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card title="Settings">
          <Table rowKey="id" loading={loading} dataSource={settings} columns={columns} pagination={{ pageSize: 8 }} />
        </Card>
      </Col>
    </Row>
  );
}

function ChannelsTab() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [accounts, setAccounts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => getChannelAccounts().then(setAccounts);

  useEffect(() => { load().catch((err) => message.error(err.message)).finally(() => setLoading(false)); }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createChannelAccount(values);
      await load();
      form.resetFields();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteChannelAccount(id);
      await load();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Display name', dataIndex: 'displayName' },
    { title: 'Type', dataIndex: 'channelType', render: (t) => <Tag>{t}</Tag> },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color="green">{s}</Tag> },
    {
      title: '', key: 'actions', width: 60,
      render: (_, a) => (
        <Popconfirm title="Remove this channel?" onConfirm={() => handleDelete(a.id)}>
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      )
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="Connect a channel">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="This registers a channel placeholder now. Live sending/receiving through a real provider (Meta, SendGrid, etc.) is the next phase of work."
          />
          <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ channelType: 'Email' }}>
            <Form.Item name="channelType" label="Channel type" rules={[{ required: true }]}>
              <Select options={CHANNEL_TYPES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="displayName" label="Display name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Support Inbox" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>Add channel</Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Card title="Connected channels">
          <Table rowKey="id" loading={loading} dataSource={accounts} columns={columns} pagination={{ pageSize: 8 }} />
        </Card>
      </Col>
    </Row>
  );
}

export function SettingsPage() {
  return (
    <>
      <Typography.Title level={2}>Settings</Typography.Title>
      <Typography.Paragraph type="secondary">Organization profile, custom configuration, and connected channels.</Typography.Paragraph>

      <Tabs
        items={[
          { key: 'profile', label: 'Profile', children: <ProfileTab /> },
          { key: 'custom', label: 'Custom settings', children: <CustomSettingsTab /> },
          { key: 'channels', label: 'Channels', children: <ChannelsTab /> }
        ]}
      />
    </>
  );
}
