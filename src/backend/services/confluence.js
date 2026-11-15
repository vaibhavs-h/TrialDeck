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
