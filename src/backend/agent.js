import api, { route } from '@forge/api';
import { getResolvedFieldMapping } from './lib/fields.js';
import { searchAll } from './lib/jira.js';
import { createReportPage, listSpaces } from './services/confluence.js';

// ---- helpers ----
// ADF [Atlassian Document Format, the JSON format Jira uses for rich text] -> plain text
function adfToText(node) {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (node.type === 'text') return node.text || '';
    const inner = (node.content || []).map(adfToText).join(node.type === 'doc' ? '\n' : '');
    return inner;
}

// turn any field value into readable text
function valueToText(v) {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (Array.isArray(v)) return v.map(valueToText).filter(Boolean).join(', ');
    if (v.type === 'doc') return adfToText(v);
    return v.value || v.name || v.displayName || '';
}

// plain text -> ADF paragraphs with strong, code, heading, bullet list support
function inlineNodes(line) {
    const nodes = line
        .split('**')
        .map((t, i) =>
            !t ? null : i % 2 === 1
                ? { type: 'text', text: t, marks: [{ type: 'strong' }] }
                : { type: 'text', text: t }
        )
        .filter(Boolean);
    return nodes.length ? nodes : [{ type: 'text', text: ' ' }];
}

export function textToAdf(text) {
    const content = [];
    let list = null;
    for (const raw of String(text).split('\n')) {
        const line = raw.trimEnd();
        if (!line.trim()) { list = null; continue; }
        const h = line.match(/^#{1,6}\s+(.*)$/);
        const b = line.match(/^[-*]\s+(.*)$/);
        if (h) {
            list = null;
            content.push({ type: 'heading', attrs: { level: 3 }, content: inlineNodes(h[1]) });
        } else if (b) {
            if (!list) { list = { type: 'bulletList', content: [] }; content.push(list); }
            list.content.push({
                type: 'listItem',
                content: [{ type: 'paragraph', content: inlineNodes(b[1]) }],
            });
        } else {
            list = null;
            content.push({ type: 'paragraph', content: inlineNodes(line) });
        }
    }
    return { type: 'doc', version: 1, content };
}

function pickIssueKey(payload, context) {
    return (
        payload?.issueKey ||
        payload?.context?.jira?.issueKey ||
        context?.jira?.issueKey
    );
}

// ---- action 1: read the deviation ----
export async function getDeviation(payload, context) {
    const key = pickIssueKey(payload, context);
    if (!key) return { error: 'No issue key provided.' };

    const res = await api.asUser().requestJira(
        route`/rest/api/3/issue/${key}?expand=names&fields=*all`
    );
    if (!res.ok) return { error: `Could not read ${key}: HTTP ${res.status}` };
    const issue = await res.json();

    // Map readable field names to values, utilizing resolved field mapping when available
    let resolvedMapping = {};
    try {
        const mappingResult = await getResolvedFieldMapping('user');
        resolvedMapping = mappingResult.mapping || {};
    } catch (err) {
        // Fall back gracefully
    }

    const fields = {};
    for (const [id, value] of Object.entries(issue.fields || {})) {
        const text = valueToText(value);
        if (text && issue.names?.[id]) fields[issue.names[id]] = text;
    }

    // Explicitly expose standard clinical trial properties
    const standardData = {
        site: resolvedMapping.site ? valueToText(issue.fields?.[resolvedMapping.site]) : (fields['site'] || fields['Site']),
        category: resolvedMapping.category ? valueToText(issue.fields?.[resolvedMapping.category]) : (fields['category'] || fields['Category']),
        rootCause: resolvedMapping.rootCause ? valueToText(issue.fields?.[resolvedMapping.rootCause]) : (fields['Root cause'] || fields['root cause']),
        subjectId: resolvedMapping.subjectId ? valueToText(issue.fields?.[resolvedMapping.subjectId]) : (fields['Subject ID'] || fields['subject id']),
        protocolVersion: resolvedMapping.protocolVersion ? valueToText(issue.fields?.[resolvedMapping.protocolVersion]) : (fields['Protocol version'] || fields['protocol version']),
        dateDetected: resolvedMapping.dateDetected ? valueToText(issue.fields?.[resolvedMapping.dateDetected]) : (fields['date detected'] || fields['Date detected']),
        reportStatus: resolvedMapping.reportStatus ? valueToText(issue.fields?.[resolvedMapping.reportStatus]) : (fields['Report status'] || fields['report status']),
    };

    const cRes = await api.asUser().requestJira(
        route`/rest/api/3/issue/${key}/comment?maxResults=20&orderBy=created`
    );
    const comments = cRes.ok
        ? ((await cRes.json()).comments || []).map((c) => ({
            author: c.author?.displayName,
            created: c.created,
            text: adfToText(c.body),
        }))
        : [];

    return {
        issueKey: key,
        summary: issue.fields?.summary,
        description: adfToText(issue.fields?.description),
        standardData,
        fields,
        comments,
    };
}

// ---- action 2: save the approved draft as a comment and update report status ----
export async function saveReportDraft(payload, context) {
    const key = pickIssueKey(payload, context);
    const text = payload?.reportText;
    if (!key || !text) return { error: 'issueKey and reportText are required.' };

    let confluencePage = null;
    let commentText = text;

    // Optional Confluence Page creation if a space is available
    try {
        const spaces = await listSpaces(10);
        if (spaces.length > 0) {
            const spaceId = spaces[0].id;
            const title = `Protocol Deviation Report - ${key} (${new Date().toISOString().slice(0, 10)})`;
            confluencePage = await createReportPage({ spaceId, title, text });
            if (confluencePage?.url) {
                commentText = `${text}\n\n---\n**Confluence Report Page:** [${confluencePage.title}](${confluencePage.url})`;
            }
        }
    } catch (confluenceErr) {
        // Fallback to Jira comment only if Confluence page creation fails
        console.warn('Confluence page creation skipped or failed, falling back to Jira comment:', confluenceErr.message);
    }

    const res = await api.asUser().requestJira(
        route`/rest/api/3/issue/${key}/comment`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ body: textToAdf(commentText) }),
        }
    );
    if (!res.ok) return { error: `Could not save comment: HTTP ${res.status}` };

    // Update report status to Draft (since a report has been drafted and saved as comment)
    // Human investigator will approve or request changes via the issue panel or subsequent confirmation
    let statusUpdated = false;
    try {
        const { mapping } = await getResolvedFieldMapping('user');
        if (mapping?.reportStatus) {
            // Attempt to update Report status to Draft
            await api.asUser().requestJira(
                route`/rest/api/3/issue/${key}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        fields: {
                            [mapping.reportStatus]: { value: 'Draft' },
                        },
                    }),
                }
            );
            statusUpdated = true;
        }
    } catch (ignore) {
        // Status update is best-effort; don't fail report draft saving if option doesn't exist
    }

    return {
        saved: true,
        issueKey: key,
        status: 'Draft',
        statusUpdated,
        confluencePageUrl: confluencePage?.url || null,
    };
}

// ---- action 3: find similar deviations ----
export async function findSimilarDeviations(payload, context) {
    const key = pickIssueKey(payload, context);
    const site = payload?.site;
    const rootCause = payload?.rootCause;
    const summary = payload?.summary;

    let jqlParts = ['issuetype = "Protocol Deviation"'];
    if (key) {
        jqlParts.push(`key != "${key}"`);
    }

    if (site) {
        jqlParts.push(`(text ~ "${site}" OR description ~ "${site}")`);
    } else if (rootCause) {
        jqlParts.push(`(text ~ "${rootCause}" OR description ~ "${rootCause}")`);
    } else if (summary) {
        // extract alphanumeric words
        const words = summary.replace(/[^a-zA-Z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3)
            .slice(0, 3);
        if (words.length > 0) {
            jqlParts.push(`text ~ "${words.join(' ')}"`);
        }
    }

    const jql = jqlParts.join(' AND ') + ' ORDER BY created DESC';
    try {
        const issues = await searchAll(jql, ['summary', 'status', 'created'], 5, { as: 'user', max: 5 });
        return {
            similarDeviations: issues.map(iss => ({
                key: iss.key,
                summary: iss.fields?.summary || '',
                status: iss.fields?.status?.name || '',
                created: iss.fields?.created || '',
            })),
            count: issues.length,
        };
    } catch (err) {
        return {
            similarDeviations: [],
            count: 0,
            message: 'No similar deviations found or search query not supported on this project.',
        };
    }
}