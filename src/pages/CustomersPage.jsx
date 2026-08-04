import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Table, Typography, App as AntApp } from 'antd';
import { createCustomer, getCustomers } from '../api';

const { Title, Paragraph } = Typography;

export function CustomersPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [customers, setCustomers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    { title: 'Name', dataIndex: 'fullName' },
    { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
    { title: 'Phone', dataIndex: 'phone', render: (v) => v || '—' },
    { title: 'Added', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString() }
  ];

  return (
    <>
      <Title level={2}>Customers</Title>
      <Paragraph type="secondary">The people your organization supports across every channel.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a customer">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input type="email" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add customer</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Customers">
            <Table rowKey="id" loading={loading} dataSource={customers} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
