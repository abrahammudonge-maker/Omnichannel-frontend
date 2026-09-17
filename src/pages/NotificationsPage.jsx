import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, List, Tag, Typography, App as AntApp } from 'antd';
import { getCurrentUser, getNotifications, markNotificationRead } from '../api';

const { Title, Paragraph } = Typography;

export function NotificationsPage({ onChange }) {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => getNotifications(currentUser.userId).then(setNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!currentUser?.userId) return;
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      await load();
      onChange?.();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleOpen = async (n) => {
    if (!n.isRead) await handleMarkRead(n.id);
    if (n.conversationId) navigate(`/conversations/${n.conversationId}`);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await Promise.all(notifications.filter((n) => !n.isRead).map((n) => markNotificationRead(n.id)));
      await load();
      onChange?.();
    } catch (err) {
      message.error(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>Notifications</Title>
          <Paragraph type="secondary">Updates relevant to you across every conversation.</Paragraph>
        </div>
        <Button onClick={handleMarkAllRead} loading={markingAll} disabled={unreadCount === 0}>
          Mark all as read
        </Button>
      </div>

      <Card loading={loading}>
        <List
          locale={{ emptyText: 'No notifications yet.' }}
          dataSource={notifications}
          renderItem={(n) => (
            <List.Item
              actions={[
                ...(n.conversationId ? [<Button key="open" size="small" type="link" onClick={() => handleOpen(n)}>Open conversation</Button>] : []),
                ...(!n.isRead ? [<Button key="read" size="small" onClick={() => handleMarkRead(n.id)}>Mark as read</Button>] : [])
              ]}
            >
              <List.Item.Meta
                title={<>{n.title} {!n.isRead && <Tag color="blue">Unread</Tag>}</>}
                description={<>{n.message}<br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</Typography.Text></>}
              />
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}
