'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createBillingRequestManager, retryAfterMs } = require('../services/billingRequestManager');

const quietLogger = { info() {} };

test('deduplicates concurrent identical GETs and caches only when TTL is requested', async () => {
  const manager = createBillingRequestManager({ logger: quietLogger });
  let calls = 0;
  let release;
  const execute = () => {
    calls += 1;
    return new Promise(resolve => { release = () => resolve({ status: 200, data: { stock: 4 } }); });
  };
  const one = manager.request({ method: 'GET', key: 'variants', cacheTtlMs: 1000, execute });
  const two = manager.request({ method: 'GET', key: 'variants', cacheTtlMs: 1000, execute });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  release();
  assert.deepEqual(await one, await two);
  await manager.request({ method: 'GET', key: 'variants', cacheTtlMs: 1000, execute: () => { calls += 1; return { status: 200, data: {} }; } });
  assert.equal(calls, 1);
});

test('honors Retry-After and retries only GET within the configured attempt limit', async () => {
  let now = 1000;
  const waits = [];
  const manager = createBillingRequestManager({
    logger: quietLogger,
    now: () => now,
    wait: async milliseconds => { waits.push(milliseconds); now += milliseconds; },
    getGetRetries: () => 1,
    getMaxRetryDelayMs: () => 5000,
  });
  let calls = 0;
  const result = await manager.request({
    method: 'GET', key: 'live-stock',
    execute: () => {
      calls += 1;
      if (calls === 1) throw Object.assign(new Error('rate limited'), { response: { status: 429, headers: { 'retry-after': '2' } } });
      return { status: 200, data: { available_stock: 2 } };
    },
  });
  assert.equal(result.data.available_stock, 2);
  assert.equal(calls, 2);
  assert.deepEqual(waits, [2000]);
  assert.equal(retryAfterMs('3'), 3000);
});

test('does not retry invoice POST requests after a 429', async () => {
  const manager = createBillingRequestManager({ logger: quietLogger, getGetRetries: () => 2 });
  let calls = 0;
  await assert.rejects(manager.request({
    method: 'POST', label: '/billings',
    execute: () => {
      calls += 1;
      throw Object.assign(new Error('rate limited'), { response: { status: 429, headers: { 'retry-after': '0' } } });
    },
  }), error => error.response.status === 429);
  assert.equal(calls, 1);
});

test('stops GET retrying at the configured attempt count', async () => {
  const manager = createBillingRequestManager({ logger: quietLogger, getGetRetries: () => 1 });
  let calls = 0;
  await assert.rejects(manager.request({
    method: 'GET', key: 'repeated-rate-limit',
    execute: () => {
      calls += 1;
      throw Object.assign(new Error('rate limited'), { response: { status: 429, headers: { 'retry-after': '0' } } });
    },
  }), error => error.response.status === 429);
  assert.equal(calls, 2);
});

test('enforces concurrency and bounds pending work', async () => {
  const manager = createBillingRequestManager({ getConcurrency: () => 1, getMaxQueued: () => 1, logger: quietLogger });
  let release;
  const first = manager.request({ method: 'GET', key: 'first', execute: () => new Promise(resolve => { release = resolve; }) });
  await new Promise(resolve => setImmediate(resolve));
  const second = manager.request({ method: 'GET', key: 'second', execute: async () => ({ status: 200 }) });
  await assert.rejects(manager.request({ method: 'GET', key: 'third', execute: async () => ({ status: 200 }) }), { code: 'BILLING_QUEUE_FULL' });
  release({ status: 200 });
  await Promise.all([first, second]);
  assert.deepEqual(manager.getQueueState(), { active: 0, queued: 0, cacheEntries: 0 });
});
