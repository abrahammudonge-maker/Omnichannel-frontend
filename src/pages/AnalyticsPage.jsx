import { useEffect, useState } from 'react';
import { Alert, Card, Col, Row, Segmented, Spin, Statistic, Table, Tag, Typography, App as AntApp } from 'antd';
import { getMessagingAnalytics } from '../api';
import { ChannelBadge, EmptyState, GoalCard, PageHeader } from '../components/ui';

const { Text } = Typography;
const DELIVERY_GOAL = 90;
const FAILURE_LIMIT = 5;
const PERIODS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 }
];

function StatTile({ label, value, hint, suffix }) {
  return (
    <Card>
      <Statistic title={label} value={value} suffix={suffix} />
      {hint && <Text type="secondary" style={{ fontSize: 12 }}>{hint}</Text>}
    </Card>
  );
}

export function AnalyticsPage() {
  const { message } = AntApp.useApp();
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMessagingAnalytics(days)
      .then(setSummary)
      .catch((err) => message.error(err.message))
      .finally(() => setLoading(false));
  }, [days, message]);

  const failureRate = summary && summary.outbound > 0 ? Math.round((summary.failed * 1000) / summary.outbound) / 10 : 0;
  const maxDailyTotal = summary ? Math.max(1, ...summary.daily.map((d) => d.inbound + d.outbound)) : 1;

  const channelColumns = [
    { title: 'Channel', dataIndex: 'channel', render: (c) => <ChannelBadge channel={channelIdFor(c)} /> },
    { title: 'Received', dataIndex: 'inbound' },
    { title: 'Sent', dataIndex: 'outbound' },
    {
      title: 'Not delivered',
      dataIndex: 'failed',
      render: (v) => (v > 0 ? <Tag color="red">{v}</Tag> : <Text type="secondary">0</Text>)
    }
  ];

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="How your messages are performing across every channel."
        actions={<Segmented options={PERIODS} value={days} onChange={setDays} />}
      />

      {loading || !summary ? (
        <div style={{ padding: 60, textAlign: 'center' }}><Spin /></div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <StatTile label="Messages received" value={summary.inbound} hint="From customers in this period" />
            </Col>
            <Col xs={24} md={12} lg={6}>
              <StatTile label="Messages sent" value={summary.outbound} hint="By your team, including templates" />
            </Col>
            <Col xs={24} md={12} lg={6}>
              <StatTile
                label="Delivered or read"
                value={summary.delivered}
                suffix={`of ${summary.outbound}`}
                hint="Messages Meta confirmed reached the customer"
              />
            </Col>
            <Col xs={24} md={12} lg={6}>
              <StatTile label="Not delivered" value={summary.failed} hint="Rejected or failed — see below" />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card title="Goals">
                <GoalCard
                  title="Delivery rate"
                  value={summary.deliveryRate}
                  target={DELIVERY_GOAL}
                  hint={`Target: at least ${DELIVERY_GOAL}% of sent messages reach customers.`}
                />
                <div style={{ height: 12 }} />
                <GoalCard
                  title="Failure rate"
                  value={failureRate}
                  target={FAILURE_LIMIT}
                  hint={`Keep failures under ${FAILURE_LIMIT}%. Lower is better.`}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Where each channel stands">
                <Table
                  rowKey="channel"
                  size="small"
                  pagination={false}
                  columns={channelColumns}
                  dataSource={summary.byChannel}
                  locale={{ emptyText: <EmptyState title="No messages in this period" /> }}
                />
              </Card>
            </Col>
          </Row>

          {summary.failed > 0 && (
            <Alert
              style={{ marginTop: 16 }}
              type="warning"
              showIcon
              title={`${summary.failed} message${summary.failed === 1 ? '' : 's'} weren't delivered`}
              description="Common causes: the customer's number isn't on WhatsApp, the 24-hour reply window closed, or a template was rejected. Open the conversation to see the details."
            />
          )}

          <Card title="Daily volume" style={{ marginTop: 16 }}>
            {summary.daily.length === 0 ? (
              <EmptyState title="No messages in this period" />
            ) : (
              summary.daily.map((day) => {
                const total = day.inbound + day.outbound;
                return (
                  <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <Text style={{ width: 96, fontSize: 12 }}>{day.date}</Text>
                    <div style={{ flex: 1, background: 'rgba(127,127,127,0.12)', borderRadius: 6, height: 14, overflow: 'hidden' }}>
                      <div style={{ width: `${(total / maxDailyTotal) * 100}%`, height: '100%', background: '#0c82c9', borderRadius: 6 }} />
                    </div>
                    <Text style={{ minWidth: 180, fontSize: 12 }}>
                      {day.inbound} received · {day.outbound} sent{day.failed > 0 ? ` · ${day.failed} not delivered` : ''}
                    </Text>
                  </div>
                );
              })
            )}
          </Card>
        </>
      )}
    </>
  );
}

// The summary groups channels by their display name, so map back to the enum id for the badge.
function channelIdFor(name) {
  const entry = Object.entries({ 1: 'WhatsApp', 2: 'FacebookMessenger', 3: 'Instagram', 4: 'Email', 5: 'Sms', 6: 'Voice' })
    .find(([, label]) => label === name);
  return entry ? Number(entry[0]) : null;
}

