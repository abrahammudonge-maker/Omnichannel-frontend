import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Space, Tag, Typography, App as AntApp } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { createTag, deleteTag, getTags } from '../api';

const { Title, Paragraph } = Typography;

export function TagsPage() {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => getTags().then(setTags);

  useEffect(() => {
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createTag(values);
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
      await deleteTag(id);
      await load();
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <>
      <Title level={2}>Tags</Title>
      <Paragraph type="secondary">Categorize conversations so they're easier to filter and report on.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Add a tag">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} block>Add tag</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Tags" loading={loading}>
            <Space size={[8, 12]} wrap>
              {tags.length ? tags.map((t) => (
                <Tag key={t.id} closeIcon={<CloseOutlined />} onClose={(e) => { e.preventDefault(); handleDelete(t.id); }} style={{ padding: '6px 10px', fontSize: 14 }}>
                  {t.name}
                </Tag>
              )) : <Paragraph type="secondary">No tags yet.</Paragraph>}
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
}
