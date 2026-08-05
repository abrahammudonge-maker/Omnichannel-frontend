import { Button, Card, Form, Input, Typography, App as AntApp } from 'antd';
import { BankOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { registerOrganization } from '../api';

const { Title, Paragraph } = Typography;

export function RegisterPage({ onSignedIn }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();

  const handleSubmit = async (values) => {
    try {
      await registerOrganization(values);
      onSignedIn();
      navigate('/dashboard');
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div className="login-grid">
      <Card variant="borderless" style={{ display: 'flex', alignItems: 'center' }} styles={{ body: { padding: 32 } }}>
        <div className="brand-badge" style={{ marginBottom: 16 }}>OC</div>
        <Title level={3} style={{ marginTop: 0 }}>Set up your organization</Title>
        <Paragraph type="secondary">
          Creates a new, fully isolated workspace with you as its first admin. Your data is never visible to other organizations on this platform.
        </Paragraph>
      </Card>

      <Card variant="borderless" styles={{ body: { padding: 32 } }}>
        <Title level={4} style={{ marginTop: 0 }}>Create your organization</Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item name="organizationName" label="Organization name" rules={[{ required: true }]}>
            <Input size="large" prefix={<BankOutlined />} placeholder="Acme Support" autoFocus />
          </Form.Item>
          <Form.Item name="adminFirstName" label="Your first name" rules={[{ required: true }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="Alicia" />
          </Form.Item>
          <Form.Item name="adminLastName" label="Your last name" rules={[{ required: true }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="Chen" />
          </Form.Item>
          <Form.Item name="email" label="Your email" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" prefix={<MailOutlined />} placeholder="you@company.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input size="large" prefix={<PhoneOutlined />} placeholder="+254712345678" />
          </Form.Item>
          <Form.Item name="country" label="Country" rules={[{ required: true }]}>
            <Input size="large" placeholder="Kenya" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, message: 'At least 8 characters.' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="At least 8 characters" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>Create organization</Button>
          </Form.Item>
        </Form>
        <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 0 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </Paragraph>
      </Card>
    </div>
  );
}
