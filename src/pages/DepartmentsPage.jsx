import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Popconfirm, Row, Table, Typography, App as AntApp } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { createDepartment, deleteDepartment, getDepartments } from '../api';

const { Title, Paragraph } = Typography;

export function DepartmentsPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => getDepartments().then(setDepartments);

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createDepartment(values);
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
      await deleteDepartment(id);
      await load();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Description', dataIndex: 'description', render: (v) => v || '—' },
    {
      title: '', key: 'actions', width: 60,
      render: (_, d) => (
        <Popconfirm title="Delete this department?" onConfirm={() => handleDelete(d.id)}>
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      )
    }
  ];

  return (
    <>
      <Title level={2}>Departments</Title>
      <Paragraph type="secondary">Group your organization into departments, then build teams underneath them.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a department">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add department</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Departments">
            <Table rowKey="id" loading={loading} dataSource={departments} columns={columns} pagination={{ pageSize: 8 }} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
