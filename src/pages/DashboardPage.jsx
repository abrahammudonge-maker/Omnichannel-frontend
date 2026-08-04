import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, List, Row, Statistic, Tag, Typography, App as AntApp } from 'antd';
import { getConversations, getCustomers, getNotifications, getUsers, getCurrentUser } from '../api';

const { Title, Paragraph } = Typography;
const CHANNEL_LABELS = { 1: 'WhatsApp', 2: 'Facebook Messenger', 3: 'Instagram', 4: 'Email', 5: 'SMS' };

export function DashboardPage() {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [conversations, setConversations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    Promise.all([
      getConversations(),
      getCustomers(),
      getUsers(),
      currentUser?.userId ? getNotifications(currentUser.userId) : Promise.resolve([])
    ])
      .then(([conversationData, customerData, userData, notificationData]) => {
        setConversations(conversationData);
        setCustomers(customerData);
        setUsers(userData);
        setNotifications(notificationData);
      })
      .catch((err) => message.error(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customerNameById = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c.fullName));
    return map;
  }, [customers]);

  const openCount = conversations.filter((c) => c.status === 'Open').length;
  const unassignedCount = conversations.filter((c) => !c.assignedUserId).length;
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const recentConversations = useMemo(
    () => [...conversations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [conversations]
  );

  return (
    <>
      <Title level={2}>Dashboard</Title>
      <Paragraph type="secondary">Everything happening across your organization, at a glance.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card><Statistic title="Open tickets" value={openCount} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Total conversations" value={conversations.length} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Customers" value={customers.length} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Team members" value={users.length} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card title="Needs attention">
            <Statistic title="Unassigned conversations" value={unassignedCount} styles={{ content: { color: unassignedCount ? '#ff6b6b' : undefined } }} />
            <Statistic title="Unread notifications" value={unreadNotifications} style={{ marginTop: 20 }} styles={{ content: { color: unreadNotifications ? '#ffb703' : undefined } }} />
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Recent conversations">
            <List
              locale={{ emptyText: 'No conversations yet.' }}
              dataSource={recentConversations}
              renderItem={(c) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/conversations/${c.id}`)}
                  actions={[<Tag key="channel">{CHANNEL_LABELS[c.channel] ?? 'Unknown'}</Tag>, <Tag key="status" color="blue">{c.status}</Tag>]}
                >
                  <List.Item.Meta title={customerNameById.get(c.customerId) ?? c.customerId} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
