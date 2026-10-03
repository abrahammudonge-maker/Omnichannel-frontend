import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Segmented, Spin, Typography, App as AntApp } from 'antd';
import { getCurrentUser, getNotifications, markNotificationRead } from '../api';
import { ChannelBadge, EmptyState, PageHeader, PersonAvatar, groupByDay, timeAgo } from '../components/ui';

const { Text } = Typography;

const CHANNEL_KEYWORDS = [
  { match: /whatsapp/i, channel: 1 },
  { match: /messenger/i, channel: 2 },
  { match: /instagram/i, channel: 3 },
  { match: /email/i, channel: 4 },
  { match: /sms/i, channel: 5 }
];

// Notifications don't carry a channel field yet, so it's read from the title text.
function channelFromTitle(title) {
  return CHANNEL_KEYWORDS.find((k) => k.match.test(title ?? ''))?.channel ?? null;
}

function senderFromTitle(title) {
  const match = /from\s+(.+)$/i.exec(title ?? '');
  return match ? match[1].trim() : (title ?? 'Notification');
}

export function NotificationsPage({ onChange }) {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => getNotifications(currentUser.userId).then(setNotifications);

  useEffect(() => {
    if (!currentUser?.userId) return;
    load().catch((err) => message.error(err.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enriched = useMemo(
    () => notifications.map((n) => ({ ...n, channel: channelFromTitle(n.title), sender: senderFromTitle(n.title) })),
    [notifications]
  );

  const unreadCount = enriched.filter((n) => !n.isRead).length;

  const visible = useMemo(() => {
    if (filter === 'all') return enriched;
    if (filter === 'unread') return enriched.filter((n) => !n.isRead);
    return enriched.filter((n) => String(n.channel) === filter);
  }, [enriched, filter]);

  const groups = groupByDay(visible, (n) => n.createdAt);

  const markRead = async (id) => {
    await markNotificationRead(id);
    await load();
    onChange?.();
  };

  const open = async (n) => {
    if (!n.isRead) {
      try {
        await markRead(n.id);
      } catch (err) {
        message.error(err.message);
      }
    }
    if (n.conversationId) navigate(`/conversations/${n.conversationId}`);
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await Promise.all(enriched.filter((n) => !n.isRead).map((n) => markNotificationRead(n.id)));
      await load();
      onChange?.();
    } catch (err) {
      message.error(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: `Unread${unreadCount ? ` (${unreadCount})` : ''}`, value: 'unread' },
    { label: 'WhatsApp', value: '1' },
    { label: 'Messenger', value: '2' },
    { label: 'Email', value: '4' }
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="New messages and activity across all your channels."
        actions={<Button onClick={markAll} loading={markingAll} disabled={unreadCount === 0}>Mark all as read</Button>}
      />

      <Segmented options={filterOptions} value={filter} onChange={setFilter} style={{ marginBottom: 16 }} />

      <div style={{ background: 'var(--ant-color-bg-container, #fff)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(127,127,127,0.18)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
        ) : groups.length === 0 ? (
          <EmptyState
            title={filter === 'unread' ? "You're all caught up" : 'No notifications here'}
            hint="New messages from customers will appear here."
          />
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div style={{ padding: '10px 16px', background: 'rgba(127,127,127,0.06)' }}>
                <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{group.label}</Text>
              </div>
              {group.items.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => open(n)}
                  onKeyDown={(e) => { if (e.key === 'Enter') open(n); }}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(127,127,127,0.12)',
                    background: n.isRead ? 'transparent' : 'rgba(12,130,201,0.06)'
                  }}
                >
                  <PersonAvatar name={n.sender} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text strong={!n.isRead}>{n.sender}</Text>
                      {n.channel && <ChannelBadge channel={n.channel} />}
                    </div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Text type="secondary">{n.message}</Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{timeAgo(n.createdAt)}</Text>
                    {!n.isRead && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0c82c9' }} aria-label="Unread" />}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
