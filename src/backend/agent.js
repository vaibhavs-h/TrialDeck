import api, { route } from '@forge/api';

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

// plain text -> ADF paragraphs
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

function textToAdf(text) {
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
    console.log('getDeviation payload:', JSON.stringify(payload)); // check shape in forge logs
    const key = pickIssueKey(payload, context);
    if (!key) return { error: 'No issue key provided.' };

    const res = await api.asUser().requestJira(
        route`/rest/api/3/issue/${key}?expand=names&fields=*all`
    );
    if (!res.ok) return { error: `Could not read ${key}: HTTP ${res.status}` };
    const issue = await res.json();

    // map readable field names to values, skip empty ones
    const fields = {};
    for (const [id, value] of Object.entries(issue.fields || {})) {
        const text = valueToText(value);
        if (text && issue.names?.[id]) fields[issue.names[id]] = text;
    }

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

    return { issueKey: key, summary: issue.fields?.summary, fields, comments };
}

// ---- action 2: save the approved draft as a comment ----
export async function saveReportDraft(payload, context) {
    console.log('saveReportDraft payload keys:', Object.keys(payload || {}));
    const key = pickIssueKey(payload, context);
    const text = payload?.reportText;
    if (!key || !text) return { error: 'issueKey and reportText are required.' };

    const res = await api.asUser().requestJira(
        route`/rest/api/3/issue/${key}/comment`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ body: textToAdf(text) }),
        }
    );
    if (!res.ok) return { error: `Could not save comment: HTTP ${res.status}` };
    return { saved: true, issueKey: key };
}