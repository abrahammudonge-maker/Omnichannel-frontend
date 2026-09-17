import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Empty, Image, Input, List, Modal, Row, Select, Skeleton, Space, Tag, Tooltip, Typography, Upload, App as AntApp } from 'antd';
import { ArrowLeftOutlined, FileOutlined, FileTextOutlined, PaperClipOutlined, SendOutlined } from '@ant-design/icons';
import {
  addInternalNote,
  assignConversation,
  getConversationById,
  getCurrentUser,
  getCustomers,
  getInternalNotes,
  getConversationTagIds,
  getAttachments,
  getAttachmentObjectUrl,
  downloadAttachment,
  getMessageTemplatesByChannel,
  getTags,
  getMessages,
  getUsers,
  sendMessage,
  sendTemplateMessage,
  replaceConversationTags,
  uploadAttachment,
  updateConversationStatus
} from '../api';

const { Title, Paragraph, Text } = Typography;
const CHANNEL_LABELS = { 1: 'WhatsApp', 2: 'Facebook Messenger', 3: 'Instagram', 4: 'Email', 5: 'SMS' };
const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const REFRESH_INTERVAL_MS = 15000;

function extractAttachmentId(attachmentUrl) {
  return attachmentUrl?.match(/\/attachments\/([0-9a-fA-F-]{36})\/download/)?.[1] ?? null;
}

function countTemplateVariables(bodyText) {
  const matches = [...(bodyText || '').matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  return matches.length ? Math.max(...matches) : 0;
}

function renderTemplatePreview(bodyText, values) {
  return values.reduce((text, value, i) => text.replaceAll(`{{${i + 1}}}`, value || `{{${i + 1}}}`), bodyText || '');
}

function MessageStatusIndicator({ status }) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'failed') {
    return <Tooltip title="Failed to send"><span style={{ color: '#ff4d4f' }}>⚠</span></Tooltip>;
  }
  if (normalized === 'read') {
    return <Tooltip title="Read"><span style={{ color: '#4cc9f0', letterSpacing: -2, fontWeight: 700 }}>✓✓</span></Tooltip>;
  }
  if (normalized === 'delivered') {
    return <Tooltip title="Delivered"><span style={{ opacity: 0.7, letterSpacing: -2, fontWeight: 700 }}>✓✓</span></Tooltip>;
  }
  if (normalized === 'sent' || normalized === 'queued') {
    return <Tooltip title={normalized === 'queued' ? 'Sending…' : 'Sent'}><span style={{ opacity: 0.7, fontWeight: 700 }}>✓</span></Tooltip>;
  }
  return null;
}

function MessageAttachment({ attachmentUrl, messageType, toast }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const attachmentId = extractAttachmentId(attachmentUrl);
  const isImage = messageType === 'Image';

  useEffect(() => {
    if (!isImage || !attachmentId) return undefined;
    let cancelled = false;
    let currentUrl = null;
    getAttachmentObjectUrl(attachmentId).then((url) => {
      if (cancelled) { URL.revokeObjectURL(url); return; }
      currentUrl = url;
      setObjectUrl(url);
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachmentId, isImage]);

  if (!attachmentId) return null;

  if (isImage) {
    return objectUrl
      ? <Image src={objectUrl} width={220} style={{ borderRadius: 8 }} />
      : <Skeleton.Image active style={{ width: 220, height: 160 }} />;
  }

  return (
    <Button
      size="small"
      icon={<FileOutlined />}
      onClick={() => downloadAttachment(attachmentId, messageType || 'attachment').catch((err) => toast.error(err.message))}
    >
      {messageType || 'Attachment'}
    </Button>
  );
}

export function ConversationDetailPage() {
  const { id } = useParams();
  const currentUser = getCurrentUser();
  const { message: toast } = AntApp.useApp();

  const [conversation, setConversation] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagIds, setTagIds] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [attaching, setAttaching] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateValues, setTemplateValues] = useState([]);
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const threadRef = useRef(null);

  const loadAll = async () => {
    const [conversationData, customerData, userData, messageData, noteData, tagData, attachmentData] = await Promise.all([
      getConversationById(id),
      getCustomers(),
      getUsers(),
      getMessages(id),
      getInternalNotes(id),
      getTags(),
      getAttachments(id)
    ]);
    setConversation(conversationData);
    setCustomers(customerData);
    setUsers(userData);
    setMessages(messageData);
    setNotes(noteData);
    setTags(tagData);
    setTagIds(await getConversationTagIds(id));
    setAttachments(attachmentData);
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

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return undefined;

    let isInitialForThisConversation = true;
    const observer = new ResizeObserver(() => {
      if (isInitialForThisConversation) {
        el.scrollTop = el.scrollHeight;
        isInitialForThisConversation = false;
        return;
      }
      // Only auto-follow new content if the user hasn't scrolled up to read history.
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < 150) {
        el.scrollTop = el.scrollHeight;
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [id]);

  const customer = useMemo(() => customers.find((c) => c.id === conversation?.customerId), [customers, conversation]);
  const isWhatsApp = conversation?.channel === 1;

  useEffect(() => {
    if (!isWhatsApp || !conversation?.channelAccountId) { setTemplates([]); return; }
    getMessageTemplatesByChannel(conversation.channelAccountId)
      .then((data) => setTemplates(data.filter((t) => t.status === 'APPROVED')))
      .catch(() => setTemplates([]));
  }, [isWhatsApp, conversation?.channelAccountId]);

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedTemplateId), [templates, selectedTemplateId]);

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    setTemplateValues(new Array(countTemplateVariables(template?.bodyText)).fill(''));
  };

  const handleTemplateValueChange = (index, value) => {
    setTemplateValues((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplateId) return;
    setSendingTemplate(true);
    try {
      await sendTemplateMessage({ conversationId: id, templateId: selectedTemplateId, bodyParameters: templateValues });
      setTemplateModalOpen(false);
      setSelectedTemplateId(null);
      setTemplateValues([]);
      setMessages(await getMessages(id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingTemplate(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageBody.trim() && !pendingAttachment) return;
    setBusy(true);
    try {
      await sendMessage({ conversationId: id, body: messageBody.trim(), attachmentId: pendingAttachment?.id ?? null });
      setMessageBody('');
      setPendingAttachment(null);
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

  const handleTagsChange = async (nextTagIds) => {
    setBusy(true);
    try {
      await replaceConversationTags(id, nextTagIds);
      setTagIds(nextTagIds);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    setAttaching(true);
    try {
      const attachmentId = await uploadAttachment(id, file);
      setAttachments(await getAttachments(id));
      setPendingAttachment({ id: attachmentId, fileName: file.name });
      onSuccess('ok');
    } catch (err) {
      onError(err);
      toast.error(err.message);
    } finally {
      setAttaching(false);
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

            <div className="thread" ref={threadRef}>
              {messages.length ? messages.map((m) => (
                <div key={m.id} className={`bubble ${m.direction === 'Outbound' ? 'outbound' : ''}`}>
                  {m.body && <div>{m.body}</div>}
                  {m.attachmentUrl && (
                    <div style={{ marginTop: m.body ? 6 : 0 }}>
                      <MessageAttachment attachmentUrl={m.attachmentUrl} messageType={m.messageType} toast={toast} />
                    </div>
                  )}
                  <div className="meta">
                    {m.direction} • {new Date(m.sentAt).toLocaleString()}
                    {m.direction === 'Outbound' && (
                      <span style={{ marginLeft: 6 }}><MessageStatusIndicator status={m.status} /></span>
                    )}
                  </div>
                </div>
              )) : <Empty description="No messages yet." />}
            </div>

            {pendingAttachment && (
              <Tag closable onClose={() => setPendingAttachment(null)} icon={<PaperClipOutlined />} style={{ marginBottom: 8 }}>
                {pendingAttachment.fileName} — will send with your next message
              </Tag>
            )}
            <Input.Search
              placeholder="Type a reply..."
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              onSearch={handleSendMessage}
              enterButton={<Button type="primary" icon={<SendOutlined />} loading={busy}>Send</Button>}
            />
            <Space style={{ marginTop: 8 }}>
              <Upload customRequest={handleUpload} showUploadList={false} accept="image/*,.pdf,.doc,.docx,.txt" maxCount={1}>
                <Button loading={attaching}>Attach file (max 10 MB)</Button>
              </Upload>
              {isWhatsApp && (
                <Tooltip title={templates.length === 0 ? 'No approved templates for this WhatsApp number yet — design and sync one under Settings → Message templates.' : undefined}>
                  <Button
                    icon={<FileTextOutlined />}
                    disabled={templates.length === 0}
                    onClick={() => setTemplateModalOpen(true)}
                  >
                    Send template
                  </Button>
                </Tooltip>
              )}
            </Space>
            {attachments.length > 0 && <List size="small" header="Conversation files" dataSource={attachments} renderItem={(attachment) => <List.Item actions={[<Button key="download" size="small" onClick={() => downloadAttachment(attachment.id, attachment.fileName).catch((err) => toast.error(err.message))}>Download</Button>]}>{attachment.fileName} ({Math.ceil(attachment.fileSize / 1024)} KB)</List.Item>} />}
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
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Tags</Text>
              <Select mode="multiple" style={{ width: '100%', marginTop: 6 }} value={tagIds} onChange={handleTagsChange} disabled={busy}
                options={tags.filter((tag) => tag.isActive).map((tag) => ({ value: tag.id, label: tag.name }))} />
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

      <Modal
        title="Send a message template"
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        onOk={handleSendTemplate}
        confirmLoading={sendingTemplate}
        okButtonProps={{ disabled: !selectedTemplateId || templateValues.some((v) => !v.trim()) }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Templates work outside the 24-hour reply window"
          description="Use this when the customer hasn't messaged in the last 24 hours — a regular reply can't reach them, but an approved template can."
        />
        <Select
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Choose a template"
          value={selectedTemplateId}
          onChange={handleSelectTemplate}
          options={templates.map((t) => ({ value: t.id, label: `${t.name} (${t.language})` }))}
        />
        {selectedTemplate && templateValues.map((value, i) => (
          <Input
            key={i}
            style={{ marginBottom: 8 }}
            placeholder={`Variable {{${i + 1}}}`}
            value={value}
            onChange={(e) => handleTemplateValueChange(i, e.target.value)}
          />
        ))}
        {selectedTemplate && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            Preview: {renderTemplatePreview(selectedTemplate.bodyText, templateValues)}
          </Typography.Paragraph>
        )}
      </Modal>
    </>
  );
}
