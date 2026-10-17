'use strict';

const crypto = require('crypto');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const positiveInt = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
};

function retryAfterMs(value, now = Date.now()) {
  if (value === undefined || value === null || value === '') return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const at = Date.parse(value);
  return Number.isFinite(at) ? Math.max(0, at - now) : null;
}

function createBillingRequestManager({
  getConcurrency = () => positiveInt(process.env.BILLING_API_MAX_CONCURRENT_REQUESTS, 1, 20),
  getMaxQueued = () => positiveInt(process.env.BILLING_API_MAX_QUEUED_REQUESTS, 40, 1000),
  getGetRetries = () => positiveInt(String(Number(process.env.BILLING_API_GET_RETRIES ?? 1) + 1), 2, 3) - 1,
  getMaxRetryDelayMs = () => positiveInt(process.env.BILLING_API_MAX_RETRY_DELAY_MS, 5000, 60000),
  getFallbackCooldownMs = () => positiveInt(process.env.BILLING_API_429_COOLDOWN_MS, 1000, 60000),
  now = () => Date.now(),
  wait = sleep,
  random = Math.random,
  logger = console,
} = {}) {
  let active = 0;
  let cooldownUntil = 0;
  const queue = [];
  const inFlightGets = new Map();
  const cache = new Map();

  const emit = (event, fields = {}) => {
    logger.info?.(JSON.stringify({ timestamp: new Date(now()).toISOString(), event, ...fields }));
  };

  function dispatch() {
    while (active < getConcurrency() && queue.length) {
      const job = queue.shift();
      active += 1;
      Promise.resolve().then(job.run).then(job.resolve, job.reject).finally(() => {
        active -= 1;
        dispatch();
      });
    }
  }

  function enqueue(run, metadata) {
    if (active >= getConcurrency() && queue.length >= getMaxQueued()) {
      const error = new Error('Billing request queue is busy. Please retry shortly.');
      error.code = 'BILLING_QUEUE_FULL';
      error.status = 503;
      emit('BILLING_QUEUE_REJECTED', metadata);
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      queue.push({ run, resolve, reject });
      dispatch();
    });
  }

  function cacheRead(key) {
    const record = cache.get(key);
    if (!record) return undefined;
    if (record.expiresAt <= now()) {
      cache.delete(key);
      return undefined;
    }
    // Touch for bounded LRU eviction.
    cache.delete(key);
    cache.set(key, record);
    return record.value;
  }

  function cacheWrite(key, value, ttlMs) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) return;
    for (const [cacheKey, record] of cache) if (record.expiresAt <= now()) cache.delete(cacheKey);
    cache.delete(key);
    cache.set(key, { value, expiresAt: now() + ttlMs });
    const maxEntries = positiveInt(process.env.BILLING_API_CACHE_MAX_ENTRIES, 100, 1000);
    while (cache.size > maxEntries) cache.delete(cache.keys().next().value);
  }

  async function request({ method = 'GET', key, cacheTtlMs = 0, bypassCache = false, execute, label = 'billing' }) {
    const normalizedMethod = String(method).toUpperCase();
    const requestKey = key || `${normalizedMethod}:${crypto.randomUUID()}`;
    const meta = { correlationId: crypto.randomUUID(), method: normalizedMethod, endpoint: label };

    if (normalizedMethod === 'GET' && cacheTtlMs > 0 && !bypassCache) {
      const cached = cacheRead(requestKey);
      if (cached !== undefined) {
        emit('BILLING_CATALOG_CACHE_HIT', meta);
        return cached;
      }
    }
    if (normalizedMethod === 'GET' && inFlightGets.has(requestKey)) {
      emit('BILLING_REQUEST_DEDUPED', meta);
      return inFlightGets.get(requestKey);
    }

    const startedAt = now();
    const operation = enqueue(async () => {
      let attempt = 0;
      while (true) {
        const waitForCooldown = cooldownUntil - now();
        if (waitForCooldown > 0) {
          const error = new Error('Billing is rate-limiting requests. Please wait and try again.');
          error.status = 429;
          error.code = 'BILLING_COOLDOWN';
          error.retryAfterMs = waitForCooldown;
          emit('BILLING_COOLDOWN_REJECTED', { ...meta, retryAfterMs: waitForCooldown });
          throw error;
        }
        try {
          emit('BILLING_REQUEST', { ...meta, attempt: attempt + 1 });
          const result = await execute();
          const payloadStatus = Number(result?.data?.status);
          if (Number.isFinite(payloadStatus) && payloadStatus >= 400) {
            const error = new Error(result.data?.message || `Billing returned application status ${payloadStatus}.`);
            error.response = { status: payloadStatus, data: result.data, headers: result.headers };
            throw error;
          }
          const status = result?.status ?? 200;
          emit('BILLING_RESPONSE', { ...meta, status, durationMs: now() - startedAt, retries: attempt });
          if (normalizedMethod === 'GET' && cacheTtlMs > 0 && !bypassCache) cacheWrite(requestKey, result, cacheTtlMs);
          return result;
        } catch (error) {
          const status = Number(error.response?.status || error.status);
          if (status !== 429) {
            emit('BILLING_REQUEST_FAILED', { ...meta, status: status || null, code: error.code || null, durationMs: now() - startedAt, retries: attempt });
            throw error;
          }
          const headerDelay = retryAfterMs(error.response?.headers?.['retry-after'], now());
          const cooldown = headerDelay ?? getFallbackCooldownMs();
          cooldownUntil = Math.max(cooldownUntil, now() + cooldown);
          const maxWait = getMaxRetryDelayMs();
          if (normalizedMethod !== 'GET' || attempt >= getGetRetries() || cooldown > maxWait) {
            error.retryAfterMs = cooldown;
            emit('BILLING_RATE_LIMIT', { ...meta, status: 429, retryAfterMs: cooldown, retries: attempt, durationMs: now() - startedAt });
            throw error;
          }
          const exponential = Math.min(maxWait, 250 * (2 ** attempt));
          const baseDelay = headerDelay ?? exponential;
          const jitteredDelay = headerDelay === null
            ? Math.min(maxWait, Math.round(baseDelay * (0.75 + random() * 0.5)))
            : headerDelay;
          attempt += 1;
          emit('BILLING_RATE_LIMIT_RETRY', { ...meta, status: 429, retryAfterMs: jitteredDelay, retries: attempt });
          await wait(jitteredDelay);
          cooldownUntil = Math.min(cooldownUntil, now());
        }
      }
    }, meta);

    if (normalizedMethod === 'GET') {
      inFlightGets.set(requestKey, operation);
      operation.finally(() => {
        if (inFlightGets.get(requestKey) === operation) inFlightGets.delete(requestKey);
      }).catch(() => {});
    }
    return operation;
  }

  return { request, getQueueState: () => ({ active, queued: queue.length, cacheEntries: cache.size }) };
}

const billingRequestManager = createBillingRequestManager();

module.exports = { createBillingRequestManager, billingRequestManager, retryAfterMs };
