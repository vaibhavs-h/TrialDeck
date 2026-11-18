import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { searchAll } from './jira.js';

const STORAGE_KEY_PROJECT_SCOPE = 'trialdeck:project_scope:v1';
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function detectDeviationProjects(as = 'user') {
  const client = as === 'app' ? api.asApp() : api.asUser();
  const detected = new Map();

  // 1. First probe via JQL search for any existing Protocol Deviation issues
  try {
    const issues = await searchAll(
      'issuetype = "Protocol Deviation"',
      ['project'],
      50,
      { as, max: 200 }
    );
    for (const issue of issues) {
      const proj = issue.fields?.project;
      if (proj?.key) {
        detected.set(proj.key, {
          key: proj.key,
          id: proj.id,
          name: proj.name || proj.key,
        });
      }
    }
  } catch (err) {
    console.warn('[TrialDeck] JQL detection for Protocol Deviation failed:', err.message);
  }

  // 2. Query projects list to find any project with Protocol Deviation in its issuetypes
  try {
    const res = await client.requestJira(route`/rest/api/3/project/search?maxResults=50`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const projects = data.values || (Array.isArray(data) ? data : []);
      for (const proj of projects) {
        if (!detected.has(proj.key)) {
          // If we have fewer than 5 projects, inspect issue types if available
          if (proj.issueTypes && Array.isArray(proj.issueTypes)) {
            const hasDevType = proj.issueTypes.some(
              t => t.name && t.name.trim().toLowerCase() === 'protocol deviation'
            );
            if (hasDevType) {
              detected.set(proj.key, {
                key: proj.key,
                id: proj.id,
                name: proj.name || proj.key,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[TrialDeck] Project search failed:', err.message);
  }

  const projectList = [...detected.values()];
  return projectList;
}

export async function getActiveProjectScope(as = 'user') {
  let savedSetting = null;
  try {
    savedSetting = await kvs.get(STORAGE_KEY_PROJECT_SCOPE);
  } catch {}

  const detectedProjects = await detectDeviationProjects(as);

  // If a specific project was chosen by the user and still valid
  if (savedSetting && savedSetting !== 'ALL') {
    const exists = detectedProjects.find(p => p.key === savedSetting);
    return {
      selectedScope: savedSetting,
      selectedProject: exists || { key: savedSetting, name: savedSetting },
      detectedProjects,
      targetProjectKeys: [savedSetting],
      isAllProjects: false,
    };
  }

  // Default: target all detected project keys, or empty if none found
  return {
    selectedScope: 'ALL',
    selectedProject: null,
    detectedProjects,
    targetProjectKeys: detectedProjects.map(p => p.key),
    isAllProjects: true,
  };
}

export async function setActiveProjectScope(scopeKey) {
  const valueToStore = scopeKey || 'ALL';
  await kvs.set(STORAGE_KEY_PROJECT_SCOPE, valueToStore);
  return { ok: true, selectedScope: valueToStore };
}
