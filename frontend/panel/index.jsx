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
const REPORT_APPEARANCE = { 'Not provided': 'default', 'Not started': 'default', Drafted: 'inprogress', Approved: 'success' };

const cardStyle = xcss({
  backgroundColor: 'color.background.neutral',
  borderRadius: 'border.radius',
  padding: 'space.100',
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
  const [approving, setApproving] = useState(false);
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

  const approveReport = async () => {
    setApproving(true);
    setStatusMessage(null);
    try {
      await invoke('updateReportStatus', { issueKey, status: 'Approved' });
      setApproving(false);
      setStatusMessage({ appearance: 'success', text: 'Report status set to Approved with GCP compliance audit comment.' });
      fetchDeviation();
    } catch (e) {
      setApproving(false);
      setStatusMessage({ appearance: 'error', text: `Failed to approve report: ${String(e)}` });
    }
  };

  if (!issueKey) return <Text>Open an issue in the CLIN project to view protocol details.</Text>;
  if (loading) return <Spinner label="Loading deviation details..." />;
  if (error) return <SectionMessage appearance="error" title="Could not load deviation">{error}</SectionMessage>;
  if (!deviation) return <Text>No deviation data found.</Text>;

  const related = deviation.related || [];

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

      <Row label="Report status">
        <Lozenge appearance={REPORT_APPEARANCE[deviation.reportStatus] ?? 'default'}>
          {deviation.reportStatus}
        </Lozenge>
      </Row>

      <Button appearance="primary" isLoading={approving} onClick={approveReport} shouldFitContainer>
        Approve Regulatory Report
      </Button>
      <Text size="small" color="color.text.subtle" align="center">
        Sets Report Status to Approved in Jira and logs compliance audit.
      </Text>

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
