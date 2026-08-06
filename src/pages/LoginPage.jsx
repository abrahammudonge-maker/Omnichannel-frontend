import { Button, Card, Form, Input, Typography, App as AntApp } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api';

const { Title, Paragraph } = Typography;

export function LoginPage({ onSignedIn }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();

  const handleSubmit = async ({ email, password }) => {
    try {
      await loginUser(email, password);
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
        <Title level={3} style={{ marginTop: 0 }}>Omnichannel Command Center</Title>
        <Paragraph type="secondary">
          Unified support operations for every customer touchpoint. Sign in with your agent account to open the live workspace.
        </Paragraph>
      </Card>

      <Card variant="borderless" styles={{ body: { padding: 32 } }}>
        <Title level={4} style={{ marginTop: 0 }}>Sign in</Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item name="email" label="Agent email" rules={[{ required: true, type: 'email' }]}>
            <Input size="large" prefix={<MailOutlined />} placeholder="you@company.com" autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>Sign in</Button>
          </Form.Item>
        </Form>
        <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 0 }}>
          New organization? <Link to="/register">Create one</Link>
        </Paragraph>
        <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 0, fontSize: 12 }}>
          <Link to="/privacy-policy">Privacy Policy</Link> · <Link to="/terms-of-service">Terms of Service</Link>
        </Paragraph>
      </Card>
    </div>
  );
}
