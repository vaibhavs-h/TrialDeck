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

// Jira issue panel (UI Kit, ~320px wide). Matches the Stitch "Deviation panel":
// severity lozenge + category, protocol/site, subject ID, similar deviations,
// CAPA status, report status, and the "Draft report with AI" button.

// TODO: replace with real custom field IDs once getFieldIdsByName() exists in src/backend/services/jira.js.
const FIELDS = {
  severity: 'customfield_10100',
  category: 'customfield_10101',
  subjectId: 'customfield_10102',
  protocolVersion: 'customfield_10103',
  site: 'customfield_10104',
  capaKey: 'customfield_10105',
  reportStatus: 'customfield_10106',
};

const SEVERITY_APPEARANCE = { Critical: 'removed', Major: 'removed', Minor: 'moved' };
const REPORT_APPEARANCE = { 'Not started': 'default', Drafted: 'inprogress', Approved: 'success' };

const optionValue = (v) => (v && typeof v === 'object' ? v.value ?? v.name : v);

function toViewModel(issue) {
  const f = issue.fields ?? {};
  return {
    key: issue.key,
    severity: optionValue(f[FIELDS.severity]) ?? 'Minor',
    category: optionValue(f[FIELDS.category]) ?? 'UNCATEGORIZED',
    subjectId: f[FIELDS.subjectId] ?? 'n/a',
    protocolVersion: f[FIELDS.protocolVersion] ?? 'n/a',
    site: optionValue(f[FIELDS.site]) ?? 'n/a',
    capaKey: f[FIELDS.capaKey] ?? null,
    reportStatus: optionValue(f[FIELDS.reportStatus]) ?? 'Not started',
  };
}

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
  const [related, setRelated] = useState([]);
  const [error, setError] = useState(null);
  const [drafting, setDrafting] = useState(false);
  const [draftMessage, setDraftMessage] = useState(null);

  useEffect(() => {
    if (!issueKey) return;
    (async () => {
      try {
        const vm = toViewModel(await invoke('getDeviation', { issueKey }));
        setDeviation(vm);
        setRelated(await invoke('getRelatedDeviations', { site: vm.site, issueKey }));
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [issueKey]);

  const draftReport = async () => {
    setDrafting(true);
    setDraftMessage(null);
    try {
      // Resolver not built yet (Rovo agent lands in weeks 4-5).
      await invoke('draftReport', { issueKey });
      setDraftMessage({ appearance: 'success', text: 'Draft created. Review it before approving.' });
    } catch (e) {
      setDraftMessage({ appearance: 'warning', text: 'Report drafting is not available yet.' });
    } finally {
      setDrafting(false);
    }
  };

  if (error) return <SectionMessage appearance="error" title="Could not load deviation">{error}</SectionMessage>;
  if (!deviation) return <Spinner label="Loading deviation" />;

  return (
    <Stack space="space.150">
      <Inline spread="space-between" alignBlock="center">
        <Lozenge appearance={SEVERITY_APPEARANCE[deviation.severity] ?? 'default'} isBold>
          {deviation.severity}
        </Lozenge>
        <Code>{`DEV-CATEGORY: ${deviation.category}`}</Code>
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
        {related.slice(0, 2).map((r) => (
          <Box key={r.key} xcss={cardStyle}>
            <Inline spread="space-between" alignBlock="center">
              <Text>
                <Code>{r.key}</Code> {r.fields?.summary}
              </Text>
              <Lozenge appearance={r.fields?.status?.statusCategory?.key === 'done' ? 'success' : 'removed'}>
                {r.fields?.status?.name ?? ''}
              </Lozenge>
            </Inline>
          </Box>
        ))}
      </Stack>

      <Row label="CAPA status">
        {deviation.capaKey ? <Code>{deviation.capaKey}</Code> : <Text>None linked</Text>}
      </Row>

      <Row label="Report status">
        <Lozenge appearance={REPORT_APPEARANCE[deviation.reportStatus] ?? 'default'}>
          {deviation.reportStatus}
        </Lozenge>
      </Row>

      <Button appearance="primary" isLoading={drafting} onClick={draftReport} shouldFitContainer>
        Draft report with AI
      </Button>
      <Text size="small" color="color.text.subtle" align="center">
        A reviewer approves all AI output.
      </Text>

      {draftMessage && (
        <SectionMessage appearance={draftMessage.appearance}>{draftMessage.text}</SectionMessage>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
