import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Input, Row, Select, Space, Statistic, Table, Tag, Typography, App as AntApp } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, SendOutlined } from '@ant-design/icons';
import { getMessageTemplates, sendBulkTemplate } from '../api';
import { EmptyState, PageHeader } from '../components/ui';

const { Text, Paragraph } = Typography;
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
    if (!/^\+?\d{7,15}$/.test(phoneNumber.replace(/\s/g, ''))) problems.push('the phone number looks wrong');
    if (bodyParameters.length !== parameterCount) {
      problems.push(`this template needs ${parameterCount} value${parameterCount === 1 ? '' : 's'} after the name, but this line has ${bodyParameters.length}`);
    }
    return { line: index + 1, phoneNumber, customerName, bodyParameters, problems };
  });
}

function StepTitle({ number, title, done }) {
  return (
    <Space>
      {done ? <CheckCircleFilled style={{ color: '#25D366' }} /> : <Tag color="blue" style={{ borderRadius: 999, margin: 0 }}>{number}</Tag>}
      <Text strong>{title}</Text>
    </Space>
  );
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
  const stepOneDone = Boolean(template);
  const stepTwoDone = parsed.length > 0 && invalid.length === 0 && !tooMany;
  const canSend = stepOneDone && stepTwoDone && !sending;
  const recipientCount = parsed.length;
  const sendLabel = `Send to ${recipientCount} ${recipientCount === 1 ? 'person' : 'people'}`;

  const confirmAndSend = () => {
    modal.confirm({
      title: `Send "${template.name}" to ${recipientCount} ${recipientCount === 1 ? 'person' : 'people'}?`,
      content: 'Send only to people who asked to hear from you. Meta charges for each message that is sent.',
      okText: 'Yes, send',
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
      title: 'Result',
      dataIndex: 'success',
      render: (ok) => (ok
        ? <Tag icon={<CheckCircleFilled />} color="success">Sent</Tag>
        : <Tag icon={<CloseCircleFilled />} color="error">Not sent</Tag>)
    },
    { title: 'Details', dataIndex: 'errorMessage', render: (v, row) => (row.success ? <Text type="secondary">Accepted by WhatsApp</Text> : v) }
  ];

  return (
    <>
      <PageHeader
        title="Bulk send"
        subtitle="Send one approved WhatsApp template to a list of people. Each person gets their own result."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Card title={<StepTitle number={1} title="Choose a template" done={stepOneDone} />}>
              {templates.length === 0 ? (
                <EmptyState title="No approved templates yet" hint="Create and get a template approved by WhatsApp first." />
              ) : (
                <>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Choose an approved template"
                    value={templateId}
                    onChange={setTemplateId}
                    options={templates.map((t) => ({ value: t.id, label: `${t.name} (${t.language})` }))}
                  />
                  {template && (
                    <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                      "{template.bodyText}"
                      {parameterCount > 0 && <> — each person needs {parameterCount} value{parameterCount === 1 ? '' : 's'}.</>}
                    </Paragraph>
                  )}
                </>
              )}
            </Card>

            <Card title={<StepTitle number={2} title="Add your recipients" done={stepTwoDone} />}>
              <Paragraph type="secondary">
                One person per line, in this order: <Text code>phone, name, value1, value2…</Text>. Leave the name empty if you don't have it.
              </Paragraph>
              <Input.TextArea
                rows={8}
                value={recipientText}
                onChange={(e) => setRecipientText(e.target.value)}
                placeholder={PLACEHOLDER}
                disabled={!template}
              />
              {!template && <Text type="secondary" style={{ fontSize: 12 }}>Choose a template first.</Text>}
              {invalid.length > 0 && (
                <Alert
                  style={{ marginTop: 12 }}
                  type="warning"
                  showIcon
                  title={`${invalid.length} line${invalid.length === 1 ? '' : 's'} need fixing before you can send`}
                  description={
                    <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                      {invalid.slice(0, 5).map((r) => (
                        <li key={r.line}>Line {r.line} ({r.phoneNumber || 'empty'}): {r.problems.join('; ')}</li>
                      ))}
                    </ul>
                  }
                />
              )}
              {tooMany && (
                <Alert style={{ marginTop: 12 }} type="error" showIcon title={`The limit is ${MAX_RECIPIENTS} people per send. Split the list and send it in parts.`} />
              )}
            </Card>

            <Card title={<StepTitle number={3} title="Review and send" done={false} />}>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                disabled={!canSend}
                loading={sending}
                onClick={confirmAndSend}
              >
                {recipientCount > 0 ? sendLabel : 'Send'}
              </Button>
              {!canSend && (
                <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                  {!stepOneDone
                    ? 'Choose a template to continue.'
                    : recipientCount === 0
                      ? 'Add at least one recipient to continue.'
                      : invalid.length > 0
                        ? 'Fix the highlighted lines to continue.'
                        : 'Remove some recipients — the limit is 500 per send.'}
                </Paragraph>
              )}
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={9}>
          <Card title="This send at a glance">
            <Row gutter={[12, 12]}>
              <Col span={12}><Statistic title="People" value={recipientCount} /></Col>
              <Col span={12}><Statistic title="Problems" value={invalid.length} valueStyle={{ color: invalid.length ? '#faad14' : undefined }} /></Col>
            </Row>
            <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
              Messages are paced automatically, so about 5 are sent each second per sending number. Large lists take a few minutes.
            </Paragraph>
          </Card>

          {result && (
            <Card title={`Results: ${result.sent} sent, ${result.failed} not sent`} style={{ marginTop: 16 }}>
              <Table
                rowKey={(row) => `${row.phoneNumber}-${row.externalMessageId ?? row.errorMessage}`}
                size="small"
                columns={resultColumns}
                dataSource={result.results}
                pagination={{ pageSize: 8 }}
              />
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
}
