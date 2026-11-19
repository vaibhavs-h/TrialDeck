import { listPages, getPageMeta, getPageVersions, getPageVersionBody } from './services/confluence.js';
import { htmlToBlocks, analyzeBlocks, buildPlan, amendmentLabel, defaultDueDate } from './lib/amendmentAnalysis.js';
import { analyzeAmendment, createAmendmentTasks } from './resolvers/amendments.js';
import { getSites } from './resolvers/deviations.js';
import { getCreateMeta } from './resolvers/writes.js';

// Helper to resolve page by ID or Title
async function resolvePageId(pageIdOrTitle) {
  if (!pageIdOrTitle) return null;
  const input = String(pageIdOrTitle).trim();
  if (/^\d+$/.test(input)) return input;

  const pages = await listPages(50);
  const matched = pages.find(p => p.title.toLowerCase() === input.toLowerCase());
  return matched ? matched.id : null;
}

// Sites loader
async function loadSites() {
  try {
    const meta = await getCreateMeta();
    const fromField = (meta.options?.site ?? []).map((o) => ({ id: o.id, name: o.label || o.value }));
    if (fromField.length) return { sites: fromField, meta, source: 'site-field' };
  } catch (e) {
    // fallback
  }
  try {
    const seen = (await getSites()).filter((s) => s.name && s.name !== 'Unassigned');
    return { sites: seen.map((s) => ({ id: null, name: s.name })), meta: null, source: 'deviations' };
  } catch (e) {
    return { sites: [], meta: null, source: 'none' };
  }
}

/**
 * Action: list-protocol-pages (GET)
 * Lists candidate protocol pages in Confluence.
 * Returns at most 20 items, short fields, truncated flag, and total count.
 */
export async function listProtocolPages(payload) {
  try {
    const allPages = await listPages(50);
    const limit = 20;
    const items = allPages.slice(0, limit).map(p => ({
      id: p.id,
      title: p.title,
      version: p.version,
    }));

    return {
      pages: items,
      count: items.length,
      total: allPages.length,
      truncated: allPages.length > limit,
    };
  } catch (error) {
    return {
      error: `Failed to list protocol pages: ${error.message}`,
      pages: [],
      count: 0,
      total: 0,
      truncated: false,
    };
  }
}

/**
 * Action: analyze-amendment (GET)
 * Compares two versions of a Confluence protocol page.
 * Returns changes grouped by type with source sentences.
 * Truncated to at most 20 changes.
 */
export async function analyzeAmendmentAction(payload) {
  const pageIdOrTitle = payload?.pageId || payload?.pageTitle;
  const fromVer = Number(payload?.fromVersion);
  const toVer = Number(payload?.toVersion);

  if (!pageIdOrTitle) {
    return { error: 'Please provide pageId or pageTitle.' };
  }
  if (!Number.isInteger(fromVer) || !Number.isInteger(toVer) || fromVer < 1 || toVer < 1) {
    return { error: 'fromVersion and toVersion must be positive integers.' };
  }
  if (fromVer === toVer) {
    return { error: 'fromVersion and toVersion must be different.' };
  }

  try {
    const pageId = await resolvePageId(pageIdOrTitle);
    if (!pageId) {
      return { error: `Could not find a Confluence page matching "${pageIdOrTitle}".` };
    }

    const [pageMeta, fromHtml, toHtml] = await Promise.all([
      getPageMeta(pageId),
      getPageVersionBody(pageId, fromVer),
      getPageVersionBody(pageId, toVer),
    ]);

    const allChanges = analyzeBlocks(htmlToBlocks(fromHtml), htmlToBlocks(toHtml));
    const limit = 20;
    const truncated = allChanges.length > limit;
    const changes = allChanges.slice(0, limit).map(c => ({
      type: c.type,
      area: c.area || 'General',
      section: c.section || 'General',
      summary: c.title || c.after || c.before,
      sourceSentence: c.after || c.before || c.title,
      impacts: (c.impacts || []).map(i => i.label),
    }));

    // Grouping
    const grouped = {};
    for (const c of changes) {
      const k = c.area || 'General';
      grouped[k] = grouped[k] || [];
      grouped[k].push({
        section: c.section,
        summary: c.summary,
        sourceSentence: c.sourceSentence,
        impacts: c.impacts,
      });
    }

    return {
      page: {
        id: pageMeta.id,
        title: pageMeta.title,
        url: pageMeta.url,
      },
      fromVersion: fromVer,
      toVersion: toVer,
      changesGrouped: grouped,
      totalChanges: allChanges.length,
      count: changes.length,
      truncated,
    };
  } catch (error) {
    return { error: `Amendment analysis failed: ${error.message}` };
  }
}

/**
 * Action: preview-site-tasks (GET)
 * Read-only simulation of per-site tasks that would be generated.
 * Returns at most 20 tasks, truncated flag, and total count.
 */
export async function previewSiteTasks(payload) {
  const pageIdOrTitle = payload?.pageId || payload?.pageTitle;
  const fromVer = Number(payload?.fromVersion);
  const toVer = Number(payload?.toVersion);
  const effectiveDate = payload?.effectiveDate ? String(payload.effectiveDate) : '';

  try {
    const pageId = await resolvePageId(pageIdOrTitle);
    if (!pageId) return { error: `Could not find page matching "${pageIdOrTitle}".` };

    const [pageMeta, fromHtml, toHtml, siteInfo] = await Promise.all([
      getPageMeta(pageId),
      getPageVersionBody(pageId, fromVer),
      getPageVersionBody(pageId, toVer),
      loadSites(),
    ]);

    const changes = analyzeBlocks(htmlToBlocks(fromHtml), htmlToBlocks(toHtml));
    const label = amendmentLabel(pageMeta.title, fromVer, toVer);
    const dueDate = defaultDueDate(effectiveDate);
    const plan = buildPlan(changes, siteInfo.sites, { label, dueDate });

    const allTasks = plan.sites.flatMap(s => s.tasks || []);
    const limit = 20;
    const truncated = allTasks.length > limit;
    const tasks = allTasks.slice(0, limit).map(t => ({
      site: t.key.split('|')[0],
      type: t.type,
      typeLabel: t.typeLabel,
      title: t.title,
      dueDate: t.dueDate,
    }));

    return {
      label,
      dueDate,
      siteCount: siteInfo.sites.length,
      sitesSource: siteInfo.source,
      tasks,
      count: tasks.length,
      total: allTasks.length,
      truncated,
    };
  } catch (error) {
    return { error: `Task preview failed: ${error.message}` };
  }
}

/**
 * Action: create-site-tasks (CREATE)
 * Writes tasks to Jira ONLY after human approval.
 * Creates at most 10 tasks per call, stays under 20s budget, returns remaining count.
 * Deduplicates automatically against existing tasks.
 */
export async function createSiteTasks(payload) {
  const pageIdOrTitle = payload?.pageId || payload?.pageTitle;
  const fromVer = Number(payload?.fromVersion);
  const toVer = Number(payload?.toVersion);
  const effectiveDate = payload?.effectiveDate ? String(payload.effectiveDate) : '';

  try {
    const pageId = await resolvePageId(pageIdOrTitle);
    if (!pageId) return { error: `Could not find page matching "${pageIdOrTitle}".` };

    // Delegate to existing robust createAmendmentTasks logic
    const result = await createAmendmentTasks({
      approved: true,
      pageId,
      fromVersion: fromVer,
      toVersion: toVer,
      effectiveDate,
    });

    const created = (result.created || []).map(item => item.key || item.title);
    const skipped = (result.skipped || []).length;
    const failed = (result.failed || []).length;
    const remaining = (result.pending || []).length;

    return {
      created,
      createdCount: created.length,
      skippedCount: skipped,
      failedCount: failed,
      remaining,
      note: remaining > 0
        ? `Created ${created.length} tasks in this batch. ${remaining} tasks remain. Reply APPROVE again to create the next batch.`
        : `Successfully finished! Created ${created.length} tasks (${skipped} already existed and were skipped).`,
    };
  } catch (error) {
    return { error: `Failed to create site tasks: ${error.message}` };
  }
}
