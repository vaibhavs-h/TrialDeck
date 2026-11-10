import api, { route } from '@forge/api';

/** Fetch the storage-format body of a specific version of a Confluence page. */
export async function getPageVersionBody(pageId, version) {
  const res = await api
    .asUser()
    .requestConfluence(route`/wiki/api/v2/pages/${pageId}?version=${version}&body-format=storage`);
  if (!res.ok) throw new Error(`Confluence error ${res.status}`);
  const page = await res.json();
  return page.body?.storage?.value ?? '';
}
