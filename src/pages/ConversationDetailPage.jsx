import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Col, Empty, Input, List, Row, Select, Skeleton, Typography, App as AntApp } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import {
  addInternalNote,
  assignConversation,
  getConversationById,
  getCurrentUser,
  getCustomers,
  getInternalNotes,
  getMessages,
  getUsers,
  sendMessage,
  updateConversationStatus
} from '../api';

const { Title, Paragraph, Text } = Typography;
const CHANNEL_LABELS = { 1: 'WhatsApp', 2: 'Facebook Messenger', 3: 'Instagram', 4: 'Email', 5: 'SMS' };
const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const REFRESH_INTERVAL_MS = 15000;

export function ConversationDetailPage() {
  const { id } = useParams();
  const currentUser = getCurrentUser();
  const { message: toast } = AntApp.useApp();

  const [conversation, setConversation] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    const [conversationData, customerData, userData, messageData, noteData] = await Promise.all([
      getConversationById(id),
      getCustomers(),
      getUsers(),
      getMessages(id),
      getInternalNotes(id)
    ]);
    setConversation(conversationData);
    setCustomers(customerData);
    setUsers(userData);
    setMessages(messageData);
    setNotes(noteData);
  };

  const refreshThread = async () => {
    const [conversationData, messageData, noteData] = await Promise.all([
      getConversationById(id),
      getMessages(id),
      getInternalNotes(id)
    ]);
    setConversation(conversationData);
    setMessages(messageData);
    setNotes(noteData);
  };

  useEffect(() => {
    loadAll().catch((err) => toast.error(err.message));
    const interval = setInterval(() => {
      refreshThread().catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const customer = useMemo(() => customers.find((c) => c.id === conversation?.customerId), [customers, conversation]);

  const handleSendMessage = async () => {
    if (!messageBody.trim()) return;
    setBusy(true);
    try {
      await sendMessage({ conversationId: id, body: messageBody.trim() });
      setMessageBody('');
      setMessages(await getMessages(id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteBody.trim()) return;
    setBusy(true);
    try {
      await addInternalNote({ conversationId: id, body: noteBody.trim() });
      setNoteBody('');
      setNotes(await getInternalNotes(id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setBusy(true);
    try {
      await updateConversationStatus({ conversationId: id, status: newStatus, changedBy: currentUser?.userId });
      setConversation(await getConversationById(id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (newAssignee) => {
    setBusy(true);
    try {
      await assignConversation({ conversationId: id, assignedTo: newAssignee, assignedBy: currentUser?.userId });
      setConversation(await getConversationById(id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!conversation) {
    return <Card><Skeleton active /></Card>;
  }

  return (
    <>
      <Link to="/conversations"><ArrowLeftOutlined /> Back to conversations</Link>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={15}>
          <Card>
            <Title level={4} style={{ marginTop: 0 }}>{customer?.fullName ?? 'Unknown customer'}</Title>
            <Paragraph type="secondary">{CHANNEL_LABELS[conversation.channel] ?? 'Unknown channel'} conversation</Paragraph>

            <div className="thread">
              {messages.length ? messages.map((m) => (
                <div key={m.id} className={`bubble ${m.direction === 'Outbound' ? 'outbound' : ''}`}>
                  <div>{m.body}</div>
                  <div className="meta">{m.direction} • {new Date(m.sentAt).toLocaleString()}</div>
                </div>
              )) : <Empty description="No messages yet." />}
            </div>

            <Input.Search
              placeholder="Type a reply..."
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              onSearch={handleSendMessage}
              enterButton={<Button type="primary" icon={<SendOutlined />} loading={busy}>Send</Button>}
            />
          </Card>
        </Col>

        <Col xs={24} md={9}>
          <Card title="Case details">
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Status</Text>
              <Select style={{ width: '100%', marginTop: 6 }} value={conversation.status} onChange={handleStatusChange} disabled={busy}
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
            </div>
            <div>
              <Text type="secondary">Assigned to</Text>
              <Select
                style={{ width: '100%', marginTop: 6 }}
                value={conversation.assignedUserId ?? undefined}
                placeholder="Unassigned"
                allowClear
                onChange={(v) => handleAssign(v)}
                disabled={busy}
                options={users.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))}
              />
            </div>
          </Card>

          <Card title="Internal notes" style={{ marginTop: 16 }}>
            <List
              locale={{ emptyText: 'No internal notes yet.' }}
              dataSource={notes}
              renderItem={(n) => (
                <List.Item>
                  <List.Item.Meta title={n.body} description={new Date(n.createdAt).toLocaleString()} />
                </List.Item>
              )}
            />
            <Input.TextArea
              rows={2}
              style={{ marginTop: 12 }}
              placeholder="Add an internal note (not visible to the customer)..."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
            />
            <Button style={{ marginTop: 8 }} onClick={handleAddNote} loading={busy} block>Add note</Button>
          </Card>
        </Col>
      </Row>
    </>
  );
}
