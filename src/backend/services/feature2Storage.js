import { randomUUID } from 'node:crypto';
import { kvs } from '@forge/kvs';

const CONFIG_KEY = 'config:global';
const MAX_VALUE_BYTES = 220 * 1024;
const MAX_AUDIT_ENTRIES = 500;
const LOCK_TTL_MINUTES = 2;
const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9_]+$/;

export const DEFAULT_CONFIG = {
  fieldMap: {},
  fieldMappingInitialized: false,
  deviationIssueType: 'Protocol Deviation',
  capaIssueType: 'CAPA',
  capaLinkType: '',
  patternRules: {
    siteCluster: { threshold: 3, windowDays: 30 },
    crossSiteRootCause: { threshold: 2, highAlertSites: 3, windowDays: 30 },
    siteOutlier: { meanMultiplier: 2, minimumSites: 3, minimumCount: 3, windowDays: 30 },
    majorSpike: { threshold: 2, windowDays: 14 },
    repeatAfterCapa: { windowDays: 90 },
  },
  autoCommentOnHighAlert: false,
};

export class StorageLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageLimitError';
  }
}

export class ProjectLockError extends Error {
  constructor(projectKey) {
    super(`Project state is already being updated for ${projectKey}.`);
    this.name = 'ProjectLockError';
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeObjects(base, override) {
  if (!isRecord(base) || !isRecord(override)) return override === undefined ? base : override;
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = isRecord(value) && isRecord(base[key])
      ? mergeObjects(base[key], value)
      : value;
  }
  return result;
}

function serializedBytes(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function validateProjectKey(projectKey) {
  if (typeof projectKey !== 'string' || !PROJECT_KEY_PATTERN.test(projectKey)) {
    throw new TypeError('A valid Jira project key is required.');
  }
}

function validateCacheKey(key) {
  if (typeof key !== 'string' || !key.trim()) {
    throw new TypeError('A non-empty cache key is required.');
  }
}

export async function getConfig() {
  const saved = await kvs.get(CONFIG_KEY);
  return mergeObjects(DEFAULT_CONFIG, isRecord(saved) ? saved : {});
}

export async function saveConfig(config) {
  if (!isRecord(config)) throw new TypeError('Configuration must be an object.');
  const merged = mergeObjects(DEFAULT_CONFIG, config);
  assertValueSize(CONFIG_KEY, merged);
  await kvs.set(CONFIG_KEY, merged);
  return merged;
}

export async function getCached(key, ttlSeconds = 60) {
  validateCacheKey(key);
  const cache = await kvs.get(`cache:${key}`);
  if (!isRecord(cache) || typeof cache.computedAt !== 'string' || !('data' in cache)) return null;
  const computedAt = Date.parse(cache.computedAt);
  if (!Number.isFinite(computedAt) || Date.now() - computedAt > ttlSeconds * 1000) return null;
  return cache;
}

export async function setCached(key, data, ttlSeconds = 60) {
  validateCacheKey(key);
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new TypeError('Cache TTL must be a positive number of seconds.');
  }
  const record = { data, computedAt: new Date().toISOString() };
  const storageKey = `cache:${key}`;
  assertValueSize(storageKey, record);
  await kvs.set(storageKey, record, {
    ttl: { unit: 'SECONDS', value: Math.ceil(ttlSeconds) },
  });
  return record;
}

export async function getProjectAggregates(projectKey) {
  validateProjectKey(projectKey);
  return (await kvs.get(`aggregates:${projectKey}`)) || null;
}

export async function getProjectAlerts(projectKey) {
  validateProjectKey(projectKey);
  const alerts = await kvs.get(`alerts:${projectKey}`);
  return Array.isArray(alerts) ? alerts : [];
}

function fitAlertsToStorage(alerts) {
  const trimmed = alerts.slice(-MAX_AUDIT_ENTRIES);
  while (trimmed.length > 0 && serializedBytes(trimmed) > MAX_VALUE_BYTES) trimmed.shift();
  if (alerts.length > 0 && trimmed.length === 0) {
    throw new StorageLimitError('A single alert exceeds the Forge storage value limit.');
  }
  return trimmed;
}

function assertValueSize(key, value) {
  if (serializedBytes(value) > MAX_VALUE_BYTES) {
    throw new StorageLimitError(`Stored value for ${key} exceeds the safe Forge storage limit.`);
  }
}

async function acquireProjectLock(projectKey, token) {
  const lockKey = `lock:${projectKey}`;
  try {
    await kvs.set(lockKey, { token }, {
      keyPolicy: 'FAIL_IF_EXISTS',
      ttl: { unit: 'MINUTES', value: LOCK_TTL_MINUTES },
    });
    return true;
  } catch (error) {
    const existing = await kvs.get(lockKey);
    if (existing) return false;
    throw error;
  }
}

export async function withProjectLock(projectKey, operation) {
  validateProjectKey(projectKey);
  const token = randomUUID();
  const lockKey = `lock:${projectKey}`;
  let acquired = false;
  for (let attempt = 0; attempt < 5 && !acquired; attempt++) {
    acquired = await acquireProjectLock(projectKey, token);
    if (!acquired) await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
  }
  if (!acquired) throw new ProjectLockError(projectKey);
  try {
    return await operation();
  } finally {
    const lock = await kvs.get(lockKey);
    if (isRecord(lock) && lock.token === token) await kvs.delete(lockKey);
  }
}

export async function saveProjectState(projectKey, aggregates, alerts) {
  validateProjectKey(projectKey);
  return withProjectLock(projectKey, () =>
    saveProjectStateUnlocked(projectKey, aggregates, alerts)
  );
}

export async function saveProjectStateUnlocked(projectKey, aggregates, alerts) {
  validateProjectKey(projectKey);
  const aggregateKey = `aggregates:${projectKey}`;
  const alertKey = `alerts:${projectKey}`;
  const fittedAlerts = fitAlertsToStorage(Array.isArray(alerts) ? alerts : []);
  assertValueSize(aggregateKey, aggregates);
  await kvs.transact()
    .set(aggregateKey, aggregates)
    .set(alertKey, fittedAlerts)
    .execute();
}

function boundedString(value, maxLength) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function sanitizeAuditDetails(details) {
  if (!isRecord(details)) return {};
  const sanitized = {};
  for (const [key, value] of Object.entries(details)) {
    if (/subject|patient|identifier|email|display.?name/i.test(key)) continue;
    if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
      sanitized[key.slice(0, 40)] = value;
    } else if (typeof value === 'string') {
      sanitized[key.slice(0, 40)] = value
        .replace(/\bSUBJ-[A-Z0-9_-]+\b/gi, '[redacted]')
        .slice(0, 80);
    }
    if (Object.keys(sanitized).length >= 8) break;
  }
  return sanitized;
}

function compactAuditEntry(entry) {
  const compact = {
    ts: new Date().toISOString(),
    actorAccountId: entry.actorAccountId === 'system'
      ? 'system'
      : boundedString(entry.actorAccountId, 80) || 'system',
    action: boundedString(entry.action, 60),
    targetId: boundedString(entry.targetId, 100),
    details: sanitizeAuditDetails(entry.details),
  };
  while (serializedBytes(compact) > 400 && Object.keys(compact.details).length > 0) {
    const lastKey = Object.keys(compact.details).at(-1);
    delete compact.details[lastKey];
  }
  return compact;
}

export async function getAudit(projectKey) {
  validateProjectKey(projectKey);
  const entries = await kvs.get(`audit:${projectKey}`);
  return Array.isArray(entries) ? entries.slice(-MAX_AUDIT_ENTRIES) : [];
}

export async function appendAudit(projectKey, entry) {
  validateProjectKey(projectKey);
  if (!isRecord(entry) || typeof entry.action !== 'string' || typeof entry.targetId !== 'string') {
    throw new TypeError('Audit entries require an action and targetId.');
  }
  return withProjectLock(projectKey, async () => {
    const key = `audit:${projectKey}`;
    const entries = await getAudit(projectKey);
    entries.push(compactAuditEntry(entry));
    while (entries.length > MAX_AUDIT_ENTRIES || serializedBytes(entries) > MAX_VALUE_BYTES) entries.shift();
    assertValueSize(key, entries);
    await kvs.set(key, entries);
    return entries.at(-1);
  });
}
