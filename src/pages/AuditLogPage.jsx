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

  const columns = [
    { title: 'Action', dataIndex: 'action', render: (a) => <Tag color="blue">{a}</Tag> },
    { title: 'Entity', dataIndex: 'entity' },
    { title: 'By', dataIndex: 'userId', render: (id) => id ? userNameById.get(id) ?? 'Unknown' : 'System' },
    { title: 'IP', dataIndex: 'ipAddress', render: (v) => v || '—' },
    { title: 'When', dataIndex: 'timestamp', render: (d) => new Date(d).toLocaleString() }
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
