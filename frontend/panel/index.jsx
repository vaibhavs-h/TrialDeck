import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box,
  Button,
  Code,
  Heading,
  Inline,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Text,
  useProductContext,
  xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const SEVERITY_APPEARANCE = { major: 'removed', minor: 'moved', unknown: 'default' };
const REPORT_APPEARANCE = {
  'Not provided': 'default',
  'Not started': 'default',
  Draft: 'inprogress',
  Drafted: 'inprogress',
  Approved: 'success',
  'Changes Requested': 'moved',
};

const cardStyle = xcss({
  backgroundColor: 'color.background.neutral',
  borderRadius: 'border.radius',
  padding: 'space.100',
});

const reportCardStyle = xcss({
  backgroundColor: 'color.background.neutral.subtle',
  borderWidth: 'border.width',
  borderColor: 'color.border',
  borderStyle: 'solid',
  borderRadius: 'border.radius',
  padding: 'space.150',
});

const Row = ({ label, children }) => (
  <Inline spread="space-between" alignBlock="center">
    <Text color="color.text.subtle">{label}</Text>
    {children}
  </Inline>
);

const App = () => {
  const context = useProductContext();
  const issueKey = context?.extension?.issue?.key;

  const [deviation, setDeviation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchDeviation = () => {
    if (!issueKey) return;
    setLoading(true);
    invoke('getDeviation', { issueKey })
      .then((data) => {
        setDeviation(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDeviation();
  }, [issueKey]);

  const updateStatus = async (newStatus, auditNote) => {
    setProcessing(true);
    setStatusMessage(null);
    try {
      await invoke('updateReportStatus', { issueKey, status: newStatus });
      setProcessing(false);
      setStatusMessage({
        appearance: newStatus === 'Approved' ? 'success' : 'information',
        text: `Report status updated to ${newStatus}. ${auditNote}`,
      });
      fetchDeviation();
    } catch (e) {
      setProcessing(false);
      setStatusMessage({ appearance: 'error', text: `Failed to update status: ${String(e)}` });
    }
  };

  if (!issueKey) return <Text>Open a Jira issue to view TrialDeck protocol deviation details.</Text>;
  if (loading) return <Spinner label="Loading deviation details..." />;
  if (error) {
    return (
      <SectionMessage appearance="warning" title="Protocol Deviation Setup">
        <Text>
          Could not load protocol deviation details for this issue.
          Ensure the issue has the &quot;Protocol Deviation&quot; work type with standard fields.
          See the SETUP.md guide on GitHub for quick 5-minute setup instructions.
        </Text>
      </SectionMessage>
    );
  }
  if (!deviation) {
    return (
      <SectionMessage appearance="information" title="No Protocol Details">
        <Text>
          This issue is not registered as a Protocol Deviation, or custom fields are pending.
          Refer to SETUP.md to map your fields.
        </Text>
      </SectionMessage>
    );
  }

  const related = deviation.related || [];
  const comments = deviation.comments || [];
  const aiReportComment = comments.find(c => (c.text || '').includes('AI DRAFT (human-approved)'));
  const currentReportStatus = deviation.reportStatus || (aiReportComment ? 'Draft' : 'Not started');

  return (
    <Stack space="space.150">
      <Inline spread="space-between" alignBlock="center">
        <Lozenge appearance={SEVERITY_APPEARANCE[deviation.category] ?? 'default'} isBold>
          {deviation.category?.toUpperCase() || 'MINOR'}
        </Lozenge>
        <Code>{`STATUS: ${deviation.status}`}</Code>
      </Inline>

      <Box xcss={cardStyle}>
        <Stack space="space.100">
          <Row label="Protocol & Site">
            <Text weight="bold">{`${deviation.protocolVersion} | ${deviation.site}`}</Text>
          </Row>
          <Row label="Subject Identifier">
            <Code>{deviation.subjectId}</Code>
          </Row>
        </Stack>
      </Box>

      {/* Human-in-the-Loop Report Approval Card */}
      <Box xcss={reportCardStyle}>
        <Stack space="space.100">
          <Inline spread="space-between" alignBlock="center">
            <Text weight="bold">Regulatory Deviation Report</Text>
            <Lozenge appearance={REPORT_APPEARANCE[currentReportStatus] ?? 'default'} isBold>
              {currentReportStatus}
            </Lozenge>
          </Inline>

          {aiReportComment ? (
            <Text size="small" color="color.text.subtle">
              Draft saved by Rovo Agent on {aiReportComment.time || 'recent date'}. Review below.
            </Text>
          ) : (
            <Text size="small" color="color.text.subtle">
              No report drafted yet. Use Rovo agent &quot;Deviation Reporter&quot; to draft one.
            </Text>
          )}

          {currentReportStatus === 'Draft' && (
            <Stack space="space.075">
              <Inline space="space.100" spread="space-between">
                <Button
                  appearance="primary"
                  isLoading={processing}
                  onClick={() => updateStatus('Approved', 'GCP audit trail logged.')}
                >
                  Approve Report
                </Button>
                <Button
                  appearance="subtle"
                  isLoading={processing}
                  onClick={() => updateStatus('Changes Requested', 'Investigator flagged revisions needed.')}
                >
                  Request Changes
                </Button>
              </Inline>
              <Text size="small" color="color.text.subtle">
                Investigator sign-off sets status in Jira and logs compliance record.
              </Text>
            </Stack>
          )}

          {currentReportStatus === 'Approved' && (
            <SectionMessage appearance="success">
              <Text size="small">Report is investigator-approved and ready for audit inspection.</Text>
            </SectionMessage>
          )}
        </Stack>
      </Box>

      <Stack space="space.075">
        <Inline space="space.075" alignBlock="center">
          <Heading size="xsmall">Similar deviations at this site</Heading>
          <Lozenge>{String(related.length)}</Lozenge>
        </Inline>
        {related.slice(0, 3).map((r) => (
          <Box key={r.key} xcss={cardStyle}>
            <Inline spread="space-between" alignBlock="center">
              <Text>
                <Code>{r.key}</Code> {r.summary}
              </Text>
              <Lozenge appearance={r.isDone ? 'success' : 'removed'}>
                {r.status}
              </Lozenge>
            </Inline>
          </Box>
        ))}
      </Stack>

      <Row label="CAPA status">
        {deviation.capa ? <Code>{deviation.capa.id}</Code> : <Text>{deviation.dueDate ? 'Scheduled' : 'None linked'}</Text>}
      </Row>

      {statusMessage && (
        <SectionMessage appearance={statusMessage.appearance}>{statusMessage.text}</SectionMessage>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
