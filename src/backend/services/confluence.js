import api, { route } from '@forge/api';

const isPageId = (id) => /^\d+$/.test(String(id ?? ''));

function assertPageId(pageId) {
  if (!isPageId(pageId)) throw new Error('A valid Confluence page ID is required.');
}

async function confluenceError(what, res) {
  const text = await res.text().catch(() => '');
  return new Error(`Confluence ${what} failed (status ${res.status})${text ? `: ${text.slice(0, 300)}` : ''}`);
}

/** Most recently edited pages the current user can see, for the page picker. */
export async function listPages(limit = 100) {
  const res = await api
    .asUser()
    .requestConfluence(route`/wiki/api/v2/pages?limit=${limit}&sort=-modified-date&status=current`);
  if (!res.ok) throw await confluenceError('page list', res);
  const data = await res.json();
  return (data.results ?? []).map((p) => ({
    id: String(p.id),
    title: p.title,
    version: p.version?.number ?? null,
  }));
}

/** Title, latest version number and browser link for a page. */
export async function getPageMeta(pageId) {
  assertPageId(pageId);
  const res = await api.asUser().requestConfluence(route`/wiki/api/v2/pages/${pageId}`);
  if (!res.ok) throw await confluenceError('page lookup', res);
  const page = await res.json();
  const base = page._links?.base ?? '';
  const webui = page._links?.webui ?? '';
  return {
    id: String(page.id),
    title: page.title,
    latestVersion: page.version?.number ?? null,
    url: base && webui ? `${base}${webui}` : null,
  };
}

/** Published versions of a page, newest first. */
export async function getPageVersions(pageId) {
  assertPageId(pageId);
  const res = await api.asUser().requestConfluence(route`/wiki/api/v2/pages/${pageId}/versions?limit=100`);
  if (!res.ok) throw await confluenceError('version list', res);
  const data = await res.json();
  return (data.results ?? [])
    .map((v) => ({
      number: v.number,
      createdAt: v.createdAt ?? null,
      message: v.message || '',
    }))
    .sort((a, b) => b.number - a.number);
}

/** Fetch the storage-format body of a specific version of a Confluence page. */
export async function getPageVersionBody(pageId, version) {
  assertPageId(pageId);
  const v = Number(version);
  if (!Number.isInteger(v) || v < 1) throw new Error('A valid version number is required.');
  const res = await api
    .asUser()
    .requestConfluence(route`/wiki/api/v2/pages/${pageId}?version=${v}&body-format=storage`);
  if (!res.ok) throw await confluenceError(`version ${v}`, res);
  const page = await res.json();
  return page.body?.storage?.value ?? '';
}

/** Lists accessible spaces for target report storage. */
export async function listSpaces(limit = 25) {
  try {
    const res = await api.asUser().requestConfluence(route`/wiki/api/v2/spaces?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(s => ({
      id: String(s.id),
      key: s.key,
      name: s.name,
    }));
  } catch {
    return [];
  }
}

/** Converts plain report text or markdown to simple Confluence storage XHTML. */
function textToStorageHtml(text) {
  const lines = String(text).split('\n');
  const htmlParts = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    const b = line.match(/^[-*]\s+(.*)$/);
    if (h) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h3>${h[1]}</h3>`);
    } else if (b) {
      if (!inList) { htmlParts.push('<ul>'); inList = true; }
      htmlParts.push(`<li>${b[1]}</li>`);
    } else {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      htmlParts.push(`<p>${formatted}</p>`);
    }
  }
  if (inList) htmlParts.push('</ul>');
  return htmlParts.join('\n');
}

/** Creates a published Confluence report page for an approved deviation report. */
export async function createReportPage({ spaceId, title, text }) {
  const bodyStorage = textToStorageHtml(text);
  const payload = {
    spaceId: String(spaceId),
    status: 'current',
    title: String(title).slice(0, 255),
    body: {
      representation: 'storage',
      value: bodyStorage,
    },
  };

  const res = await api.asUser().requestConfluence(route`/wiki/api/v2/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Confluence page creation failed (status ${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const base = data._links?.base ?? '';
  const webui = data._links?.webui ?? '';
  return {
    id: String(data.id),
    title: data.title,
    url: base && webui ? `${base}${webui}` : null,
  };
}
