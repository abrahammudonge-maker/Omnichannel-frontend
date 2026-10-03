import { Avatar as AntAvatar, Progress, Space, Tag, Typography } from 'antd';
import {
  FacebookFilled,
  InstagramOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export const CHANNEL_META = {
  1: { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: <WhatsAppOutlined /> },
  2: { key: 'messenger', label: 'Messenger', color: '#0084FF', icon: <FacebookFilled /> },
  3: { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: <InstagramOutlined /> },
  4: { key: 'email', label: 'Email', color: '#7C5CFF', icon: <MailOutlined /> },
  5: { key: 'sms', label: 'SMS', color: '#F59E0B', icon: <MessageOutlined /> },
  6: { key: 'voice', label: 'Voice', color: '#14B8A6', icon: <PhoneOutlined /> }
};

export function channelMeta(channel) {
  return CHANNEL_META[channel] ?? { key: 'other', label: 'Other', color: '#94a3b8', icon: <MessageOutlined /> };
}

export function ChannelBadge({ channel }) {
  const meta = channelMeta(channel);
  return (
    <Tag
      bordered={false}
      style={{ background: `${meta.color}1f`, color: meta.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      {meta.icon} {meta.label}
    </Tag>
  );
}

const AVATAR_PALETTE = ['#0c82c9', '#7C5CFF', '#25D366', '#E1306C', '#F59E0B', '#14B8A6', '#0084FF'];

export function initialsOf(name) {
  const parts = (name ?? '?').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function PersonAvatar({ name, size = 40 }) {
  const seed = [...(name ?? '?')].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <AntAvatar size={size} style={{ background: AVATAR_PALETTE[seed % AVATAR_PALETTE.length], fontWeight: 700, flexShrink: 0 }}>
      {initialsOf(name)}
    </AntAvatar>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>{title}</Title>
        {subtitle && <Paragraph type="secondary" style={{ marginBottom: 0 }}>{subtitle}</Paragraph>}
      </div>
      {actions && <Space wrap>{actions}</Space>}
    </div>
  );
}

export function timeAgo(value) {
  const date = new Date(value);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

export function groupByDay(items, getDate) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const buckets = { Today: [], Yesterday: [], Earlier: [] };
  items.forEach((item) => {
    const time = new Date(getDate(item)).getTime();
    if (time >= startOfToday) buckets.Today.push(item);
    else if (time >= startOfYesterday) buckets.Yesterday.push(item);
    else buckets.Earlier.push(item);
  });
  return Object.entries(buckets).filter(([, list]) => list.length > 0).map(([label, list]) => ({ label, items: list }));
}

export function GoalCard({ title, value, target, hint, unit = '%' }) {
  const reached = value >= target;
  return (
    <div style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(127,127,127,0.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>{title}</Text>
        {reached ? <Tag color="success">Goal reached</Tag> : <Text type="secondary">Goal {target}{unit}</Text>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, margin: '6px 0' }}>{value}{unit}</div>
      <Progress percent={Math.min(100, value)} showInfo={false} strokeColor={reached ? '#25D366' : '#0c82c9'} />
      {hint && <Text type="secondary" style={{ fontSize: 12 }}>{hint}</Text>}
    </div>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <Text strong>{title}</Text>
      {hint && <div><Text type="secondary">{hint}</Text></div>}
    </div>
  );
}
