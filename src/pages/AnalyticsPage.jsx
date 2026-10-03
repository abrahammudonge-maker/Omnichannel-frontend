import { useEffect, useState } from 'react';
import { Card, Col, Empty, Radio, Row, Spin, Statistic, Table, Typography, App as AntApp } from 'antd';
import { getMessagingAnalytics } from '../api';

const { Title, Paragraph, Text } = Typography;
const PERIODS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 }
];

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

  const maxDailyTotal = summary ? Math.max(1, ...summary.daily.map((d) => d.inbound + d.outbound)) : 1;

  const channelColumns = [
    { title: 'Channel', dataIndex: 'channel' },
    { title: 'Inbound', dataIndex: 'inbound' },
    { title: 'Outbound', dataIndex: 'outbound' },
    { title: 'Failed', dataIndex: 'failed', render: (v) => (v > 0 ? <Text type="danger">{v}</Text> : v) }
  ];

  return (
    <>
      <Title level={2}>Analytics</Title>
      <Paragraph type="secondary">Message volume, delivery, and failures across every connected channel.</Paragraph>

      <Radio.Group
        options={PERIODS}
        optionType="button"
        buttonStyle="solid"
        value={days}
        onChange={(e) => setDays(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {loading || !summary ? (
        <Spin />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}><Card><Statistic title="Inbound" value={summary.inbound} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Outbound" value={summary.outbound} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Delivered or read" value={summary.delivered} suffix={`/ ${summary.outbound}`} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Delivery rate" value={summary.deliveryRate} suffix="%" /></Card></Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={10}>
              <Card title="By channel">
                <Table
                  rowKey="channel"
                  size="small"
                  pagination={false}
                  columns={channelColumns}
                  dataSource={summary.byChannel}
                  locale={{ emptyText: <Empty description="No messages in this period" /> }}
                />
              </Card>
            </Col>
            <Col xs={24} md={14}>
              <Card title="Daily volume">
                {summary.daily.length === 0 ? (
                  <Empty description="No messages in this period" />
                ) : (
                  summary.daily.map((day) => {
                    const total = day.inbound + day.outbound;
                    return (
                      <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <Text style={{ width: 96, fontSize: 12 }}>{day.date}</Text>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.04)', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                          <div style={{ width: `${(total / maxDailyTotal) * 100}%`, height: '100%', background: '#1677ff' }} />
                        </div>
                        <Text style={{ width: 120, fontSize: 12 }}>
                          {day.inbound} in · {day.outbound} out{day.failed > 0 ? ` · ${day.failed} failed` : ''}
                        </Text>
                      </div>
                    );
                  })
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
