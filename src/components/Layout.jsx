import { Layout as AntLayout, Menu, Badge, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  MessageOutlined,
  TeamOutlined,
  TagsOutlined,
  BellOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
  ApartmentOutlined,
  UsergroupAddOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Sider, Content } = AntLayout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { type: 'group', label: 'Support', children: [
    { key: '/conversations', icon: <MessageOutlined />, label: 'Conversations' },
    { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
    { key: '/tags', icon: <TagsOutlined />, label: 'Tags' }
  ] },
  { type: 'group', label: 'Team', children: [
    { key: '/team/users', icon: <UserOutlined />, label: 'Users' },
    { key: '/team/departments', icon: <ApartmentOutlined />, label: 'Departments' },
    { key: '/team/teams', icon: <UsergroupAddOutlined />, label: 'Teams' }
  ] },
  { type: 'group', label: 'Workspace', children: [
    { key: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
    { key: '/audit-log', icon: <FileTextOutlined />, label: 'Audit log' }
  ] }
];

export function Layout({ isAuthenticated, onSignOut, unreadCount = 0, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    return <div className="login-shell">{children}</div>;
  }

  const decorateLabel = (item) => {
    if (item.key === '/notifications' && unreadCount > 0) {
      return { ...item, label: <span className="nav-icon-badge">{item.label} <Badge count={unreadCount} size="small" /></span> };
    }
    return item;
  };

  const items = NAV_ITEMS.map((entry) =>
    entry.type === 'group'
      ? { ...entry, children: entry.children.map(decorateLabel) }
      : decorateLabel(entry)
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px' }}>
          <div className="brand-badge">OC</div>
          <div>
            <Text strong style={{ display: 'block', color: 'white' }}>Omnichannel</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Command Center</Text>
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderInlineEnd: 'none' }}
        />

        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <Button icon={<LogoutOutlined />} block onClick={onSignOut}>Sign out</Button>
        </div>
      </Sider>

      <AntLayout>
        <Content style={{ padding: 28, maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
