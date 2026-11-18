import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { JiraRequestError } from './jira.js';

const STORAGE_KEY_FIELD_MAP = 'trialdeck:field_mapping:v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const STANDARD_FIELD_ALIASES = {
  site: [
    'site',
    'trial site',
    'sites',
    'study site',
    'investigational site',
    'center',
    'facility',
    'location',
  ],
  category: [
    'category',
    'deviation category',
    'severity',
    'severity / category',
    'severity/category',
    'deviation severity',
    'grade',
  ],
  subjectId: [
    'subject id',
    'subject',
    'participant id',
    'patient id',
    'subj id',
    'subject identifier',
    'participant identifier',
  ],
  protocolVersion: [
    'protocol version',
    'protocol',
    'protocol ver',
    'amendment version',
    'version',
    'study protocol version',
  ],
  dateDetected: [
    'date detected',
    'detected date',
    'date of detection',
    'detection date',
    'date identified',
    'event date',
    'incident date',
  ],
  rootCause: [
    'root cause',
    'cause',
    'primary cause',
    'deviation root cause',
    'root cause category',
    'reason',
  ],
  reportStatus: [
    'report status',
    'regulatory status',
    'deviation report status',
    'submission status',
    'governance status',
  ],
};

const REQUIRED_FIELDS = ['site', 'category'];

export function normalizeFieldName(name) {
  if (typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function matchFieldAlias(fieldName, aliases) {
  const normalized = normalizeFieldName(fieldName);
  if (!normalized) return false;
  return aliases.some(alias => normalizeFieldName(alias) === normalized);
}

export function findFieldByAliases(allFields, aliases) {
  if (!Array.isArray(allFields)) return null;

  // 1. Exact normalized match
  for (const alias of aliases) {
    const target = normalizeFieldName(alias);
    const match = allFields.find(f => f && normalizeFieldName(f.name) === target);
    if (match) return match;
  }

  // 2. Starts with / contains match if exact not found
  for (const alias of aliases) {
    const target = normalizeFieldName(alias);
    const match = allFields.find(f => f && normalizeFieldName(f.name).includes(target));
    if (match) return match;
  }

  return null;
}

export function matchCustomField(allFields, aliases) {
  const field = findFieldByAliases(allFields, aliases);
  return field?.id || null;
}

export function mapFieldsFromList(allFields) {
  const mapping = {};
  const missing = [];
  const details = {};

  for (const [key, aliases] of Object.entries(STANDARD_FIELD_ALIASES)) {
    const matched = findFieldByAliases(allFields, aliases);
    if (matched) {
      mapping[key] = matched.id;
      details[key] = {
        id: matched.id,
        name: matched.name,
        schema: matched.schema,
      };
    } else {
      mapping[key] = null;
      missing.push(key);
    }
  }

  const missingRequired = missing.filter(f => REQUIRED_FIELDS.includes(f));

  return {
    mapping,
    details,
    missing,
    missingRequired,
    isComplete: missing.length === 0,
    hasRequired: missingRequired.length === 0,
  };
}

async function fetchFieldsFromJira(as = 'user') {
  const client = as === 'app' ? api.asApp() : api.asUser();
  const res = await client.requestJira(route`/rest/api/3/field`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new JiraRequestError(`Failed to fetch Jira fields: HTTP ${res.status}`, res.status);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getResolvedFieldMapping(options = {}) {
  const { as = 'user', forceRefresh = false } = options;

  if (!forceRefresh) {
    try {
      const cached = await kvs.get(STORAGE_KEY_FIELD_MAP);
      if (cached && typeof cached === 'object') {
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_TTL_MS && cached.mapping) {
          // If all required fields are present, use cache
          if (cached.hasRequired) {
            return cached;
          }
        }
      }
    } catch {
      // Storage miss or parse error, proceed to fetch
    }
  }

  try {
    const allFields = await fetchFieldsFromJira(as);
    const result = mapFieldsFromList(allFields);
    const payloadToCache = {
      ...result,
      timestamp: Date.now(),
    };

    try {
      await kvs.set(STORAGE_KEY_FIELD_MAP, payloadToCache);
    } catch {
      // Ignore caching failures if storage is busy
    }

    return payloadToCache;
  } catch (error) {
    // If fetching fails, try stale cache before failing completely
    try {
      const cached = await kvs.get(STORAGE_KEY_FIELD_MAP);
      if (cached?.mapping) return cached;
    } catch {}
    
    // Return empty fallback structure without throwing
    return {
      mapping: {
        site: null,
        category: null,
        subjectId: null,
        protocolVersion: null,
        dateDetected: null,
        rootCause: null,
        reportStatus: null,
      },
      missing: Object.keys(STANDARD_FIELD_ALIASES),
      missingRequired: REQUIRED_FIELDS,
      isComplete: false,
      hasRequired: false,
      error: error.message,
    };
  }
}

export function normalizeDropdownValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return (value.value || value.name || value.label || '').trim();
  }
  return String(value).trim();
}

export function matchDropdownOption(candidate, target) {
  const normCand = normalizeFieldName(normalizeDropdownValue(candidate));
  const normTarget = normalizeFieldName(normalizeDropdownValue(target));
  return normCand === normTarget;
}
