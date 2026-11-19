import api, { route } from '@forge/api';
import { escapeJql, searchAll } from '../lib/jira.js';
import {
  amendmentLabel,
  amendmentTag,
  analyzeBlocks,
  buildPlan,
  buildTaskDescription,
  defaultDueDate,
  htmlToBlocks,
} from '../lib/amendmentAnalysis.js';
import { getPageMeta, getPageVersionBody, getPageVersions, listPages } from '../services/confluence.js';
import { getCreateMeta } from './writes.js';
import { getSites } from './deviations.js';

const SUMMARY_MAX = 255;
const CONCURRENCY = 4;
const TIME_BUDGET_MS = 18000; // Forge resolvers time out at 25s

/** Resolver: getProtocolPages() - pages for the picker. */
export async function getProtocolPages() {
  return listPages();
}

/** Resolver: getAmendmentVersions({ pageId }) - page info plus its published versions. */
export async function getAmendmentVersions(payload) {
  const pageId = String(payload?.pageId ?? '').trim();
  const [page, versions] = await Promise.all([getPageMeta(pageId), getPageVersions(pageId)]);
  return { page, versions };
}

function validateRequest(payload) {
  const pageId = String(payload?.pageId ?? '').trim();
  const fromVersion = Number(payload?.fromVersion);
  const toVersion = Number(payload?.toVersion);
  const effectiveDate = payload?.effectiveDate ? String(payload.effectiveDate) : '';

  if (!/^\d+$/.test(pageId)) throw new Error('Choose a Confluence protocol page.');
  if (!Number.isInteger(fromVersion) || !Number.isInteger(toVersion) || fromVersion < 1 || toVersion < 1) {
    throw new Error('Choose the two versions to compare.');
  }
  if (fromVersion === toVersion) throw new Error('Choose two different versions to compare.');
  if (effectiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
    throw new Error('Effective date must be a valid date.');
  }
  return { pageId, fromVersion, toVersion, effectiveDate };
}

/** Sites come from the Jira Site field options; fall back to sites seen on existing deviations. */
async function loadSites() {
  let meta = null;
  try {
    meta = await getCreateMeta();
    const fromField = (meta.options?.site ?? []).map((o) => ({ id: o.id, name: o.label || o.value }));
    if (fromField.length) return { sites: fromField, meta, source: 'site-field' };
  } catch (e) {
    console.warn('Could not read Site field options:', e.message);
  }
  try {
    const seen = (await getSites()).filter((s) => s.name && s.name !== 'Unassigned');
    return { sites: seen.map((s) => ({ id: null, name: s.name })), meta, source: 'deviations' };
  } catch (e) {
    console.warn('Could not derive sites from deviations:', e.message);
    return { sites: [], meta, source: 'none' };
  }
}

/** Returns the analysis for the browser plus the Jira create-metadata (kept server-side). */
async function runAnalysis(request) {
  const { pageId, fromVersion, toVersion, effectiveDate } = request;
  const [page, fromHtml, toHtml, siteInfo] = await Promise.all([
    getPageMeta(pageId),
    getPageVersionBody(pageId, fromVersion),
    getPageVersionBody(pageId, toVersion),
    loadSites(),
  ]);

  const changes = analyzeBlocks(htmlToBlocks(fromHtml), htmlToBlocks(toHtml));
  const label = amendmentLabel(page.title, fromVersion, toVersion);
  const dueDate = defaultDueDate(effectiveDate);
  const plan = buildPlan(changes, siteInfo.sites, { label, dueDate });

  const warnings = [];
  if (!changes.length) warnings.push('No differences were found between these two versions.');
  else if (!plan.taskCount && siteInfo.sites.length) {
    warnings.push('Changes were found, but none of them looks like it needs site action.');
  }
  if (!siteInfo.sites.length) {
    warnings.push('No sites were found. Add options to the Site field in Jira, or log a deviation for each site first.');
  }

  return {
    analysis: {
      page,
      fromVersion,
      toVersion,
      label,
      dueDate,
      changes,
      plan,
      sitesSource: siteInfo.source,
      projectKey: siteInfo.meta?.projectKey ?? null,
      warnings,
    },
    meta: siteInfo.meta,
  };
}

/** Resolver: analyzeAmendment({ pageId, fromVersion, toVersion, effectiveDate }) - read-only. */
export async function analyzeAmendment(payload) {
  const { analysis } = await runAnalysis(validateRequest(payload));
  return analysis;
}

async function postIssue(fields, optionalKeys) {
  const body = { ...fields };
  const dropped = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await api.asUser().requestJira(route`/rest/api/3/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ fields: body }),
    });
    if (res.ok) return { issue: await res.json(), dropped };

    const text = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    // If Jira rejects an optional field (not on the create screen), drop it and try again.
    const rejected = Object.keys(parsed?.errors ?? {}).filter((k) => k in body && optionalKeys.has(k));
    if (!rejected.length) {
      const msg = [...(parsed?.errorMessages ?? []), ...Object.values(parsed?.errors ?? {})].join(' | ');
      throw new Error(msg || `Jira returned status ${res.status}`);
    }
    rejected.forEach((k) => {
      delete body[k];
      dropped.push(k);
    });
  }
  throw new Error('Jira rejected the task after retries.');
}

async function existingSummaries(projectKey, tag) {
  try {
    const issues = await searchAll(
      `project = "${escapeJql(projectKey)}" AND labels = "${escapeJql(tag)}"`,
      ['summary'],
    );
    return new Set(issues.map((i) => String(i.fields?.summary ?? '').trim().toLowerCase()));
  } catch (e) {
    console.warn('Duplicate check skipped:', e.message);
    return new Set();
  }
}

async function currentUserName() {
  try {
    const res = await api.asUser().requestJira(route`/rest/api/3/myself`);
    return res.ok ? (await res.json()).displayName : null;
  } catch {
    return null;
  }
}

/**
 * Resolver: createAmendmentTasks({ approved, pageId, fromVersion, toVersion, effectiveDate, selected })
 * WRITES to Jira. Refuses to run unless the user explicitly approved the plan. The plan is rebuilt
 * on the server so the browser cannot ask for tasks the analysis did not produce.
 */
export async function createAmendmentTasks(payload) {
  if (payload?.approved !== true) {
    throw new Error('The plan must be approved before tasks are created.');
  }
  const request = validateRequest(payload);
  const { analysis, meta: analysisMeta } = await runAnalysis(request);

  const selected = Array.isArray(payload.selected) ? new Set(payload.selected) : null;
  const tasks = analysis.plan.sites
    .flatMap((s) => s.tasks.map((t) => ({ ...t, site: s.site, siteId: s.siteId })))
    .filter((t) => !selected || selected.has(t.key));
  if (!tasks.length) throw new Error('There are no tasks selected to create.');

  const meta = analysisMeta ?? (await getCreateMeta());
  if (!meta.taskTypeId) throw new Error(`No Task issue type was found in project ${meta.projectKey}.`);

  const tag = amendmentTag(request.pageId, request.fromVersion, request.toVersion);
  const [alreadyThere, approvedBy] = await Promise.all([
    existingSummaries(meta.projectKey, tag),
    currentUserName(),
  ]);

  const siteFieldId = meta.fieldMapping?.site || null;
  const optionalKeys = new Set(['labels', ...(siteFieldId ? [siteFieldId] : [])]);

  const created = [];
  const skipped = [];
  const failed = [];
  const droppedFields = new Set();

  const createOne = async (task) => {
    const summary = `[${task.site}] ${task.title}`.slice(0, SUMMARY_MAX);
    const base = { site: task.site, type: task.type, typeLabel: task.typeLabel, title: summary };

    if (alreadyThere.has(summary.trim().toLowerCase())) {
      skipped.push({ ...base, reason: 'Already created from this amendment' });
      return;
    }

    const fields = {
      project: { id: meta.projectId },
      issuetype: { id: meta.taskTypeId },
      summary,
      description: buildTaskDescription({
        task,
        site: task.site,
        label: analysis.label,
        pageUrl: analysis.page.url,
        changes: analysis.changes,
        approvedBy,
      }),
      duedate: task.dueDate,
      labels: ['protocol-amendment', tag],
    };
    if (siteFieldId) fields[siteFieldId] = task.siteId ? { id: String(task.siteId) } : { value: task.site };

    try {
      const { issue, dropped } = await postIssue(fields, optionalKeys);
      dropped.forEach((k) => droppedFields.add(k === siteFieldId ? 'Site' : k));
      created.push({ ...base, key: issue.key });
    } catch (e) {
      failed.push({ ...base, error: e.message });
    }
  };

  // Resolvers are capped at 25s by Forge, so create a few tasks at a time and stop with a margin.
  // Anything left over is reported as pending; approving again only creates the missing tasks
  // because already-created ones are detected by the amendment label.
  const queue = [...tasks];
  const deadline = Date.now() + TIME_BUDGET_MS;
  const worker = async () => {
    while (queue.length && Date.now() < deadline) await createOne(queue.shift());
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const pending = queue.map((t) => ({ site: t.site, type: t.type, typeLabel: t.typeLabel }));

  return {
    projectKey: meta.projectKey,
    created,
    skipped,
    failed,
    pending,
    notes: [...droppedFields].map(
      (f) => `Jira would not accept the "${f}" field on tasks, so it was left out (the site is in each task title).`,
    ),
  };
}
