import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Modal, Select, Space, Table, Tag, Typography, App as AntApp } from 'antd';
import { getMessageTemplates, sendBulkTemplate } from '../api';

const { Title, Paragraph, Text } = Typography;
const MAX_RECIPIENTS = 500;
const PLACEHOLDER = '254712345678, Jane Wanjiru, 1234\n254722000111, , 5678';

function countParameters(bodyText) {
  return (bodyText?.match(/\{\{\d+\}\}/g) ?? []).length;
}

// One recipient per line: phone, name (optional, may be blank), then template parameters in order.
function parseRecipients(text, parameterCount) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line, index) => {
    const cells = line.split(',').map((c) => c.trim());
    const phoneNumber = cells[0] ?? '';
    const customerName = cells[1] || null;
    const bodyParameters = cells.slice(2);
    const problems = [];
    if (!/^\+?\d{7,15}$/.test(phoneNumber.replace(/\s/g, ''))) problems.push('phone number looks invalid');
    if (bodyParameters.length !== parameterCount) problems.push(`expected ${parameterCount} parameter(s), got ${bodyParameters.length}`);
    return { line: index + 1, phoneNumber, customerName, bodyParameters, problems };
  });
}

export function BulkSendPage() {
  const { message, modal } = AntApp.useApp();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState(null);
  const [recipientText, setRecipientText] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getMessageTemplates()
      .then((data) => setTemplates(data.filter((t) => String(t.status).toUpperCase() === 'APPROVED')))
      .catch((err) => message.error(err.message));
  }, [message]);

  const template = templates.find((t) => t.id === templateId) ?? null;
  const parameterCount = template ? countParameters(template.bodyText) : 0;
  const parsed = useMemo(() => (template ? parseRecipients(recipientText, parameterCount) : []), [template, recipientText, parameterCount]);
  const invalid = parsed.filter((r) => r.problems.length > 0);
  const tooMany = parsed.length > MAX_RECIPIENTS;
  const canSend = template && parsed.length > 0 && invalid.length === 0 && !tooMany && !sending;

  const confirmAndSend = () => {
    modal.confirm({
      title: `Send "${template.name}" to ${parsed.length} recipient${parsed.length === 1 ? '' : 's'}?`,
      content: 'Only send to people who opted in to receive messages from you. Each message is charged by Meta.',
      okText: 'Send',
      onOk: async () => {
        setSending(true);
        try {
          const response = await sendBulkTemplate({
            templateId: template.id,
            recipients: parsed.map((r) => ({ phoneNumber: r.phoneNumber, customerName: r.customerName, bodyParameters: r.bodyParameters }))
          });
          setResult(response);
          message.success(response.message);
        } catch (err) {
          message.error(err.message);
        } finally {
          setSending(false);
        }
      }
    });
  };

  const resultColumns = [
    { title: 'Phone', dataIndex: 'phoneNumber' },
    {
      title: 'Status',
      dataIndex: 'success',
      render: (ok) => (ok ? <Tag color="green">Sent</Tag> : <Tag color="red">Not sent</Tag>)
    },
    { title: 'Details', dataIndex: 'errorMessage', render: (v, row) => (row.success ? row.externalMessageId : v) }
  ];

  return (
    <>
      <Title level={2}>Bulk send</Title>
      <Paragraph type="secondary">Send one approved WhatsApp template to a list of numbers. Each recipient gets their own result.</Paragraph>

      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Card title="1. Choose a template">
          <Select
            style={{ width: '100%' }}
            placeholder={templates.length === 0 ? 'No approved templates yet' : 'Choose an approved template'}
            value={templateId}
            onChange={setTemplateId}
            options={templates.map((t) => ({ value: t.id, label: `${t.name} (${t.language})` }))}
          />
          {template && (
            <Paragraph style={{ marginTop: 12, marginBottom: 0 }} type="secondary">
              {template.bodyText}
              {parameterCount > 0 && <Text type="secondary"> — needs {parameterCount} parameter{parameterCount === 1 ? '' : 's'} per recipient</Text>}
            </Paragraph>
          )}
        </Card>

        <Card title="2. Recipients">
          <Paragraph type="secondary">
            One recipient per line: <Text code>phone, name, parameter1, parameter2…</Text>. Leave the name blank if you don't have one. Up to {MAX_RECIPIENTS} per send.
          </Paragraph>
          <Input.TextArea rows={8} value={recipientText} onChange={(e) => setRecipientText(e.target.value)} placeholder={PLACEHOLDER} />
          <Space style={{ marginTop: 12 }} wrap>
            <Text>{parsed.length} recipient{parsed.length === 1 ? '' : 's'}</Text>
            {invalid.length > 0 && <Tag color="red">{invalid.length} line{invalid.length === 1 ? '' : 's'} need fixing</Tag>}
            {tooMany && <Tag color="red">Over the {MAX_RECIPIENTS} limit</Tag>}
          </Space>
          {invalid.length > 0 && (
            <Alert
              style={{ marginTop: 12 }}
              type="warning"
              showIcon
              title="Fix these lines before sending"
              description={invalid.slice(0, 5).map((r) => `Line ${r.line} (${r.phoneNumber || 'blank'}): ${r.problems.join('; ')}`).join(' · ')}
            />
          )}
          <Button type="primary" style={{ marginTop: 16 }} disabled={!canSend} loading={sending} onClick={confirmAndSend}>
            Send to {parsed.length} recipient{parsed.length === 1 ? '' : 's'}
          </Button>
        </Card>

        {result && (
          <Card title={`Results — ${result.sent} sent, ${result.failed} not sent`}>
            <Table
              rowKey={(row) => `${row.phoneNumber}-${row.externalMessageId ?? row.errorMessage}`}
              size="small"
              columns={resultColumns}
              dataSource={result.results}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        )}
      </Space>
    </>
  );
}
