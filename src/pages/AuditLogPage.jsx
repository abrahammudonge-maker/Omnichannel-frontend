import { useEffect, useMemo, useState } from 'react';
import { Card, Table, Tag, Typography, App as AntApp } from 'antd';
import { getAuditLogs, getUsers } from '../api';

const { Title, Paragraph } = Typography;

export function AuditLogPage() {
  const { message } = AntApp.useApp();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAuditLogs(), getUsers()])
      .then(([logData, userData]) => {
        setLogs(logData);
        setUsers(userData);
      })
      .catch((err) => message.error(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userNameById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u.id, `${u.firstName} ${u.lastName}`));
    return map;
  }, [users]);

  const actionFilters = useMemo(
    () => [...new Set(logs.map((l) => l.action))].sort().map((a) => ({ text: a, value: a })),
    [logs]
  );
  const entityFilters = useMemo(
    () => [...new Set(logs.map((l) => l.entity))].sort().map((e) => ({ text: e, value: e })),
    [logs]
  );

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      render: (a) => <Tag color={a?.startsWith('Admin') ? 'gold' : 'blue'}>{a}</Tag>,
      filters: actionFilters,
      onFilter: (value, record) => record.action === value
    },
    {
      title: 'Entity',
      dataIndex: 'entity',
      filters: entityFilters,
      onFilter: (value, record) => record.entity === value
    },
    { title: 'Details', dataIndex: 'metadata', render: (v) => v || '—' },
    { title: 'By', dataIndex: 'userId', render: (id) => id ? userNameById.get(id) ?? 'Unknown' : 'System' },
    { title: 'IP', dataIndex: 'ipAddress', render: (v) => v || '—' },
    {
      title: 'When',
      dataIndex: 'timestamp',
      render: (d) => new Date(d).toLocaleString(),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend'
    }
  ];

  return (
    <>
      <Title level={2}>Audit log</Title>
      <Paragraph type="secondary">A read-only trail of actions taken across your organization.</Paragraph>

      <Card>
        <Table rowKey="id" loading={loading} dataSource={logs} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </>
  );
}
