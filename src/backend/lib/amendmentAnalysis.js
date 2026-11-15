import { diffArrays, diffWords } from 'diff';

/**
 * Pure logic for protocol amendment analysis (no Forge/Jira calls, so it is easy to test):
 *   Confluence storage HTML -> text blocks -> diff -> classified changes -> per-site task plan.
 *
 * The classification is rule-based (keywords). It produces a DRAFT that a person reviews and
 * approves before any Jira task is created.
 */

// ---------------------------------------------------------------------------
// 1. Confluence storage format -> readable blocks
// ---------------------------------------------------------------------------

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: '-', mdash: '-', hellip: '...',
  plusmn: '±', le: '≤', ge: '≥', times: '×',
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m);
}

const HEADING_MARK = '\u0001H ';

/**
 * Convert Confluence storage-format XHTML into an ordered list of text blocks.
 * Each block remembers the heading (section) it sits under.
 * @returns {{ text: string, section: string }[]}
 */
export function htmlToBlocks(html = '') {
  let s = String(html);

  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  // Invisible macro plumbing
  s = s.replace(/<ac:parameter[^>]*>[\s\S]*?<\/ac:parameter>/gi, ' ');
  s = s.replace(/<ri:[^>]*\/>/gi, ' ');
  s = s.replace(/<ac:structured-macro[^>]*ac:name="toc"[^>]*>[\s\S]*?<\/ac:structured-macro>/gi, ' ');
  // Headings become marked lines
  s = s.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, inner) => `\n${HEADING_MARK}${inner}\n`);
  // Table cells and line breaks
  s = s.replace(/<\/t[dh]>/gi, ' | ');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|li|tr|div|blockquote|pre|ac:task-body|ac:task|ac:rich-text-body)>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);

  const blocks = [];
  let section = '';
  for (const raw of s.split('\n')) {
    let line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (line.startsWith(HEADING_MARK.trim())) {
      section = line.slice(HEADING_MARK.trim().length).replace(/\s+/g, ' ').trim();
      continue; // headings give context; they are not diffed on their own
    }
    line = line.replace(/(\s*\|)+$/, '').trim(); // trailing table separators
    if (line) blocks.push({ text: line, section });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// 2. Diff
// ---------------------------------------------------------------------------

const clip = (t, n = 110) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

/**
 * Block-level diff. A removed block directly followed by an added block is reported as one
 * "modified" change, with a word-level diff so the UI can highlight exactly what moved.
 * @returns {{ id: string, type: 'added'|'removed'|'modified', section: string, before: string,
 *   after: string, title: string, inline: {value: string, added?: boolean, removed?: boolean}[] }[]}
 */
export function diffBlocks(fromBlocks, toBlocks) {
  const parts = diffArrays(
    fromBlocks.map((b) => b.text),
    toBlocks.map((b) => b.text),
  );

  const changes = [];
  let i = 0; // index into fromBlocks
  let j = 0; // index into toBlocks
  const push = (c) => changes.push({ id: `c${changes.length + 1}`, ...c });

  for (let p = 0; p < parts.length; p++) {
    const part = parts[p];
    if (!part.added && !part.removed) {
      i += part.value.length;
      j += part.value.length;
      continue;
    }
    if (part.removed) {
      const next = parts[p + 1];
      const removed = part.value;
      const added = next?.added ? next.value : [];
      const pairs = Math.min(removed.length, added.length);

      for (let k = 0; k < pairs; k++) {
        const before = removed[k];
        const after = added[k];
        push({
          type: 'modified',
          section: toBlocks[j + k].section || fromBlocks[i + k].section,
          before,
          after,
          title: clip(after),
          inline: diffWords(before, after),
        });
      }
      for (let k = pairs; k < removed.length; k++) {
        push({
          type: 'removed', section: fromBlocks[i + k].section,
          before: removed[k], after: '', title: clip(removed[k]), inline: [],
        });
      }
      for (let k = pairs; k < added.length; k++) {
        push({
          type: 'added', section: toBlocks[j + k].section,
          before: '', after: added[k], title: clip(added[k]), inline: [],
        });
      }
      i += removed.length;
      if (next?.added) { j += added.length; p++; }
      continue;
    }
    // pure addition
    part.value.forEach((text, k) => {
      push({
        type: 'added', section: toBlocks[j + k].section,
        before: '', after: text, title: clip(text), inline: [],
      });
    });
    j += part.value.length;
  }
  return changes;
}

// ---------------------------------------------------------------------------
// 3. Classification (rule-based, draft only)
// ---------------------------------------------------------------------------

export const TASK_TYPES = [
  { type: 'reConsent', label: 'Re-consent', verb: 'Re-consent participants' },
  { type: 'irbApproval', label: 'IRB approval', verb: 'Submit amendment for IRB / ethics approval' },
  { type: 'retraining', label: 'Retraining', verb: 'Retrain site staff on protocol changes' },
  { type: 'formUpdates', label: 'Form updates', verb: 'Update site forms and eCRF' },
];

const RULES = {
  reConsent:
    /\b(consent|icf|assent|participant information|patient information|withdraw\w*|confidentiality|privacy|data sharing|data protection|risks?|side effects?|adverse)\b/i,
  irbApproval:
    /\b(irb|iec|ethics?|inclusion|exclusion|eligib\w*|endpoints?|objectives?|sample size|study design|randomi[sz]\w*|dos(e|es|ing|age)|cohorts?|population|age (limit|range)|safety|risks?|regulatory|submission|stopping rules?|discontinuation)\b/i,
  retraining:
    /\b(procedures?|visits?|schedule[sd]?|windows?|assessments?|sampling|ecg|telemetry|administration|infusion|dos(e|es|ing|age)|monitoring|collection|storage|handling|sops?|training|blind\w*|screening|follow-?up|checklists?)\b/i,
  // "forms?" must not match a consent form: that is a participant document, not site data capture.
  formUpdates:
    /\b(crf|ecrf|(?<!consent\s)forms?|case report|data collection|questionnaires?|diary|logs?|source documents?|checklists?|templates?|worksheets?|inclusion|exclusion|eligib\w*|sampling|schedule[sd]?|windows?)\b/i,
};

const REASONS = {
  reConsent: 'Participant-facing or risk wording changed',
  irbApproval: 'Substantive change that ethics committees normally review',
  retraining: 'Procedure or schedule changed, so staff need to be retrained',
  formUpdates: 'Data capture is affected, so forms/eCRF need updating',
};

const AREAS = [
  { label: 'Criteria', tone: 'info', re: /\b(inclusion|exclusion|eligib\w*|age (limit|range))\b/i },
  { label: 'Consent', tone: 'purple', re: /\b(consent|icf|assent|participant information)\b/i },
  { label: 'Safety', tone: 'danger', re: /\b(safety|adverse|ecg|telemetry|risks?|stopping rules?)\b/i },
  { label: 'Dosing / PK', tone: 'warning', re: /\b(dos(e|es|ing|age)|pk|pharmacokinetic\w*|sampling|infusion)\b/i },
  { label: 'Regulatory', tone: 'purple', re: /\b(irb|iec|ethics?|regulatory|submission|appendix)\b/i },
  { label: 'Procedures', tone: 'neutral', re: /\b(procedures?|visits?|schedule[sd]?|windows?|assessments?|follow-?up)\b/i },
];

/** Attach impacts (which task types are needed and why) and an area tag to a change. */
export function classifyChange(change) {
  // For removed text only the old wording exists; otherwise judge the new wording.
  const text = `${change.section} ${change.type === 'removed' ? change.before : `${change.after} ${change.before}`}`;
  const impacts = TASK_TYPES.filter(({ type }) => RULES[type].test(text)).map(({ type, label }) => ({
    type,
    label,
    reason: REASONS[type],
  }));
  const area = AREAS.find((a) => a.re.test(text)) || { label: 'General', tone: 'neutral' };
  return { ...change, impacts, area: area.label, areaTone: area.tone };
}

export function analyzeBlocks(fromBlocks, toBlocks) {
  return diffBlocks(fromBlocks, toBlocks).map(classifyChange);
}

// ---------------------------------------------------------------------------
// 4. Per-site plan
// ---------------------------------------------------------------------------

export function defaultDueDate(effectiveDate, now = new Date()) {
  if (effectiveDate && /^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) return effectiveDate;
  const d = new Date(now);
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export const taskKey = (site, type) => `${site}|${type}`;

/**
 * One task per site per needed task type (not per change), so the site is not flooded.
 * @param {ReturnType<typeof analyzeBlocks>} changes
 * @param {{ id?: string, name: string }[]} sites
 */
export function buildPlan(changes, sites, { label, dueDate }) {
  const activeTypes = TASK_TYPES.filter(({ type }) => changes.some((c) => c.impacts.some((i) => i.type === type)));

  const planSites = sites.map((site) => ({
    site: site.name,
    siteId: site.id ?? null,
    tasks: activeTypes.map(({ type, label: typeLabel, verb }) => ({
      key: taskKey(site.name, type),
      type,
      typeLabel,
      title: `${verb} - ${label}`,
      dueDate,
      changeIds: changes.filter((c) => c.impacts.some((i) => i.type === type)).map((c) => c.id),
    })),
  }));

  return {
    taskTypes: activeTypes.map(({ type, label: l }) => ({ type, label: l })),
    sites: planSites,
    taskCount: planSites.reduce((n, s) => n + s.tasks.length, 0),
  };
}

// ---------------------------------------------------------------------------
// 5. Jira description (Atlassian Document Format)
// ---------------------------------------------------------------------------

const textNode = (text, marks) => (marks ? { type: 'text', text, marks } : { type: 'text', text });
const paragraph = (...content) => ({ type: 'paragraph', content });

/** ADF body for a created task: why it exists, which changes caused it, and a link back. */
export function buildTaskDescription({ task, site, label, pageUrl, changes, approvedBy }) {
  const related = changes.filter((c) => task.changeIds.includes(c.id));
  const shown = related.slice(0, 8);

  const content = [
    paragraph(textNode(`Protocol amendment task for ${site}: ${label}.`)),
    paragraph(textNode(`Needed because: ${REASONS[task.type]}.`)),
  ];
  if (shown.length) {
    content.push(paragraph(textNode('Related protocol changes:', [{ type: 'strong' }])));
    content.push({
      type: 'bulletList',
      content: shown.map((c) => ({
        type: 'listItem',
        content: [paragraph(textNode(`${c.section ? `${c.section}: ` : ''}${c.title}`))],
      })),
    });
    if (related.length > shown.length) {
      content.push(paragraph(textNode(`...and ${related.length - shown.length} more.`)));
    }
  }
  if (pageUrl) {
    content.push(
      paragraph(
        textNode('Protocol page: '),
        textNode(pageUrl, [{ type: 'link', attrs: { href: pageUrl } }]),
      ),
    );
  }
  content.push(
    paragraph(
      textNode(
        `Created from an amendment analysis that was reviewed and approved${approvedBy ? ` by ${approvedBy}` : ''}. ` +
          'Draft generated automatically - verify against the protocol.',
      ),
    ),
  );
  return { version: 1, type: 'doc', content };
}

/** Label used in titles and in the dedupe tag, e.g. "Protocol v2 -> v3". */
export const amendmentLabel = (pageTitle, fromVersion, toVersion) =>
  `${pageTitle} (v${fromVersion} to v${toVersion})`;

/** Tag stored as a Jira label so re-running the same approval does not create duplicates. */
export const amendmentTag = (pageId, fromVersion, toVersion) =>
  `amendment-${pageId}-v${fromVersion}-v${toVersion}`;
