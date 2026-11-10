import { diffLines } from 'diff';
import { getPageVersionBody } from '../lib/confluence';

/** Compute only what changed between two versions so the model never reads the full protocol. */
export async function diffAmendment(pageId, fromVersion, toVersion) {
  const [from, to] = await Promise.all([
    getPageVersionBody(pageId, fromVersion),
    getPageVersionBody(pageId, toVersion),
  ]);
  const changes = diffLines(from, to)
    .filter((p) => p.added || p.removed)
    .map((p) => ({ type: p.added ? 'added' : 'removed', text: p.value.trim() }));
  return { pageId, fromVersion, toVersion, changes };
}
