import { Layout as AntLayout, Menu, Badge, Button, Typography, Tooltip, Tag } from 'antd';
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
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  CrownOutlined,
  BankOutlined,
  ContactsOutlined,
  CommentOutlined,
  ClusterOutlined,
  GroupOutlined,
  ControlOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppTheme } from '../main';
import { getCurrentUser } from '../api';

const { Sider, Content, Header } = AntLayout;
const { Text, Title } = Typography;

const ROLE_COLORS = {
  PlatformSuperAdmin: 'gold',
  OrganizationAdmin: 'purple',
  Supervisor: 'blue',
  Agent: 'cyan',
  Auditor: 'default'
};

function formatRole(role) {
  if (!role) return '';
  return role.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const NAV_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { type: 'group', label: 'Support', children: [
    { key: '/conversations', icon: <MessageOutlined />, label: 'Conversations' },
    { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
    { key: '/tags', icon: <TagsOutlined />, label: 'Tags' }
  ] },
  { type: 'group', label: 'Team', adminOnly: true, children: [
    { key: '/team/users', icon: <UserOutlined />, label: 'Users' },
    { key: '/team/departments', icon: <ApartmentOutlined />, label: 'Departments' },
    { key: '/team/teams', icon: <UsergroupAddOutlined />, label: 'Teams' }
  ] },
  { type: 'group', label: 'Workspace', children: [
    { key: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
    { key: '/audit-log', icon: <FileTextOutlined />, label: 'Audit log', adminOnly: true }
  ] }
];

const PLATFORM_ADMIN_GROUP = { type: 'group', label: 'Platform Admin', children: [
  { key: '/admin/organizations', icon: <BankOutlined />, label: 'Organizations' },
  { key: '/admin/users', icon: <CrownOutlined />, label: 'All Users' },
  { key: '/admin/customers', icon: <ContactsOutlined />, label: 'All Customers' },
  { key: '/admin/conversations', icon: <CommentOutlined />, label: 'All Conversations' },
  { key: '/admin/departments', icon: <ClusterOutlined />, label: 'All Departments' },
  { key: '/admin/teams', icon: <GroupOutlined />, label: 'All Teams' },
  { key: '/admin/organization-settings', icon: <ControlOutlined />, label: 'All Org Settings' }
] };

const PAGE_TITLES = [
  { prefix: '/dashboard', title: 'Dashboard' },
  { prefix: '/conversations', title: 'Conversations' },
  { prefix: '/customers', title: 'Customers' },
  { prefix: '/tags', title: 'Tags' },
  { prefix: '/team/users', title: 'Users' },
  { prefix: '/team/departments', title: 'Departments' },
  { prefix: '/team/teams', title: 'Teams' },
  { prefix: '/notifications', title: 'Notifications' },
  { prefix: '/settings', title: 'Settings' },
  { prefix: '/audit-log', title: 'Audit log' },
  { prefix: '/admin/organizations', title: 'Organizations' },
  { prefix: '/admin/users', title: 'All Users' },
  { prefix: '/admin/customers', title: 'All Customers' },
  { prefix: '/admin/conversations', title: 'All Conversations' },
  { prefix: '/admin/departments', title: 'All Departments' },
  { prefix: '/admin/teams', title: 'All Teams' },
  { prefix: '/admin/organization-settings', title: 'All Org Settings' }
];

function pageTitleFor(pathname) {
  const match = PAGE_TITLES.find((entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`));
  return match?.title ?? 'Omnichannel';
}

export function Layout({ isAuthenticated, onSignOut, unreadCount = 0, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';

  if (!isAuthenticated) {
    return <div className="login-shell">{children}</div>;
  }

  const currentUser = getCurrentUser();
  const isPlatformSuperAdmin = currentUser?.role === 'PlatformSuperAdmin';
  const isOrgAdminOrAbove = isPlatformSuperAdmin || currentUser?.role === 'OrganizationAdmin';
  const baseNavItems = NAV_ITEMS
    .filter((entry) => !entry.adminOnly || isOrgAdminOrAbove)
    .map((entry) => entry.type === 'group'
      ? { ...entry, children: entry.children.filter((child) => !child.adminOnly || isOrgAdminOrAbove) }
      : entry);
  const navItems = isPlatformSuperAdmin ? [...baseNavItems, PLATFORM_ADMIN_GROUP] : baseNavItems;

  const decorateLabel = (item) => {
    if (item.key === '/notifications' && unreadCount > 0) {
      return { ...item, label: <span className="nav-icon-badge">{item.label} <Badge count={unreadCount} size="small" /></span> };
    }
    return item;
  };

  const items = navItems.map((entry) =>
    entry.type === 'group'
      ? { ...entry, children: entry.children.map(decorateLabel) }
      : decorateLabel(entry)
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={260} className="app-sider">
        <div className="brand-row">
          <div className="brand-badge">OC</div>
          <div>
            <Text strong style={{ display: 'block', fontSize: 16, letterSpacing: '-0.01em' }}>Omnichannel</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Command Center</Text>
          </div>
        </div>

        <Menu
          theme={isDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderInlineEnd: 'none' }}
        />

        <div className="sider-actions">
          <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Button icon={isDark ? <SunOutlined /> : <MoonOutlined />} block onClick={toggleTheme}>
              {isDark ? 'Light mode' : 'Dark mode'}
            </Button>
          </Tooltip>
          <Button icon={<LogoutOutlined />} block danger onClick={onSignOut}>Sign out</Button>
        </div>
      </Sider>

      <AntLayout>
        <Header className="app-header">
          <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.01em' }}>
            {pageTitleFor(location.pathname)}
          </Title>
          {currentUser?.role && (
            <Tag color={ROLE_COLORS[currentUser.role] ?? 'default'} style={{ fontWeight: 600, borderRadius: 20, padding: '2px 12px' }}>
              {formatRole(currentUser.role)}
            </Tag>
          )}
        </Header>
        <Content style={{ padding: 28, maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
