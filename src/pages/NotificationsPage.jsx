import { useEffect, useState } from 'react';
import { Button, Card, List, Tag, Typography, App as AntApp } from 'antd';
import { getCurrentUser, getNotifications, markNotificationRead } from '../api';

const { Title, Paragraph } = Typography;

export function NotificationsPage({ onChange }) {
  const currentUser = getCurrentUser();
  const { message } = AntApp.useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => getNotifications(currentUser.userId).then(setNotifications);

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

  return (
    <>
      <Title level={2}>Notifications</Title>
      <Paragraph type="secondary">Updates relevant to you across every conversation.</Paragraph>

      <Card loading={loading}>
        <List
          locale={{ emptyText: 'No notifications yet.' }}
          dataSource={notifications}
          renderItem={(n) => (
            <List.Item
              actions={!n.isRead ? [<Button key="read" size="small" onClick={() => handleMarkRead(n.id)}>Mark as read</Button>] : []}
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
