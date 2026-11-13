const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { subscribe, publishNewOrder, MAX_ORDERS_PER_EVENT } = require('../services/adminOrderEvents');

test('batches and delivers 1,000 new order notifications without losing or overfilling a frame', async () => {
  const req = new EventEmitter();
  const res = new EventEmitter();
  res.destroyed = false;
  res.writableEnded = false;
  res.frames = [];
  let applyBackpressureOnce = true;
  res.writeHead = () => {};
  res.write = frame => {
    res.frames.push(frame);
    if (frame.startsWith('event: new-orders\n') && applyBackpressureOnce) {
      applyBackpressureOnce = false;
      return false;
    }
    return true;
  };

  subscribe(req, res);
  for (let id = 1; id <= 1000; id += 1) {
    publishNewOrder({ id, total: id });
  }

  const deadline = Date.now() + 2000;
  while (res.frames.length < 2 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  res.emit('drain');
  while (res.frames.length < 5 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const batches = res.frames
    .filter(frame => frame.startsWith('event: new-orders\n'))
    .map(frame => JSON.parse(frame.split('data: ')[1].trim()));
  const receivedIds = batches.flatMap(batch => batch.map(order => order.id));

  assert.equal(receivedIds.length, 1000);
  assert.deepEqual(receivedIds, Array.from({ length: 1000 }, (_, index) => index + 1));
  assert.ok(batches.every(batch => batch.length <= MAX_ORDERS_PER_EVENT));
  assert.equal(batches.length, 4);

  req.emit('close');
});
