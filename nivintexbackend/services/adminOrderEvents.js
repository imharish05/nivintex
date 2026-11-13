const clients = new Map();
const pendingOrders = [];
const MAX_ORDERS_PER_EVENT = 250;
let flushTimer = null;
let flushing = false;

function subscribe(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('event: connected\ndata: {}\n\n');
  const client = { res, queue: [], blocked: false };
  clients.set(res, client);
  res.on('drain', () => {
    client.blocked = false;
    flushClient(client);
  });
  res.on('close', () => clients.delete(res));
}

function publishNewOrder(order) {
  pendingOrders.push(order);
  if (!flushTimer && !flushing) flushTimer = setTimeout(flushPendingOrders, 25);
}

function flushClient(client) {
  while (!client.blocked && client.queue.length) {
    const message = client.queue.shift();
    if (client.res.destroyed || client.res.writableEnded) {
      clients.delete(client.res);
      return;
    }
    client.blocked = !client.res.write(message);
  }
}

function flushPendingOrders() {
  flushTimer = null;
  if (flushing) return;
  flushing = true;
  try {
    const batch = pendingOrders.splice(0, MAX_ORDERS_PER_EVENT);
    if (batch.length) {
      const message = `event: new-orders\ndata: ${JSON.stringify(batch)}\n\n`;
      for (const [res, client] of clients) {
        if (res.destroyed || res.writableEnded) {
          clients.delete(res);
          continue;
        }
        client.queue.push(message);
        flushClient(client);
      }
    }
  } finally {
    flushing = false;
    if (pendingOrders.length) {
      flushTimer = setTimeout(flushPendingOrders, 0);
    }
  }
}

module.exports = { subscribe, publishNewOrder, MAX_ORDERS_PER_EVENT };
