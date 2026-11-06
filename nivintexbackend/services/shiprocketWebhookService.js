'use strict';

const STATUS_RANK = Object.freeze({
  pending: 0,
  confirmed: 1,
  shipped: 2,
  in_transit: 3,
  out_for_delivery: 4,
  delivered: 5,
});

/**
 * Maps Shiprocket tracking status ID and/or status text to Nivintex internal Order status.
 *
 * Shiprocket standard tracking codes:
 * 6: SHIPPED
 * 7: DELIVERED
 * 8: CANCELLED
 * 9: RTO INITIATED
 * 10: RTO DELIVERED
 * 13: PICKUP SCHEDULED / OUT FOR PICKUP
 * 14: RTO OFD
 * 17: OUT FOR DELIVERY
 * 18: IN TRANSIT
 * 19: REACHED AT DESTINATION HUB
 * 42: PICKED UP
 */
function mapShiprocketStatus(statusId, statusText) {
  const code = Number(statusId);
  const text = String(statusText || '').trim().toUpperCase();

  // 1. Delivered
  if (code === 7 || text === 'DELIVERED') {
    return 'delivered';
  }

  // 2. Out for delivery
  if (code === 17 || text.includes('OUT FOR DELIVERY') || text === 'OUT_FOR_DELIVERY') {
    return 'out_for_delivery';
  }

  // 3. In transit
  if (
    [18, 19, 20, 21, 22, 24, 25, 26, 38].includes(code) ||
    text.includes('IN TRANSIT') ||
    text.includes('IN-TRANSIT') ||
    text.includes('TRANSIT') ||
    text.includes('REACHED AT') ||
    text.includes('OUT FOR PICKUP')
  ) {
    return 'in_transit';
  }

  // 4. Shipped / Picked up
  if (
    [6, 13, 42, 49].includes(code) ||
    text.includes('SHIPPED') ||
    text.includes('PICKED UP') ||
    text.includes('PICKED_UP') ||
    text.includes('PICKUP GENERATED') ||
    text.includes('AWB ASSIGNED')
  ) {
    return 'shipped';
  }

  // 5. Cancelled
  if (code === 8 || text.includes('CANCEL')) {
    return 'cancelled';
  }

  // 6. RTO (Return to Origin)
  if (code === 9 || code === 14 || text.includes('RTO INITIATED') || text.includes('RTO OFD') || text.includes('RTO IN TRANSIT')) {
    return 'return_picked_up';
  }

  if (code === 10 || text.includes('RTO DELIVERED') || text.includes('RTO RECEIVED')) {
    return 'return_received';
  }

  return null;
}

/**
 * Determines whether the order status should advance to targetStatus.
 * Protects against delayed or out-of-order webhook delivery.
 */
function shouldAdvanceStatus(currentStatus, targetStatus) {
  if (!targetStatus) return false;
  if (currentStatus === targetStatus) return false;

  // Cancellations and returns can be applied whenever received
  if (['cancelled', 'return_requested', 'return_approved', 'return_picked_up', 'return_received', 'refunded'].includes(targetStatus)) {
    return true;
  }

  const currentRank = STATUS_RANK[currentStatus];
  const targetRank = STATUS_RANK[targetStatus];

  // If current status is outside linear hierarchy, permit transition
  if (currentRank === undefined) return true;
  if (targetRank === undefined) return false;

  // Only advance forward (e.g. shipped -> in_transit -> out_for_delivery -> delivered)
  return targetRank > currentRank;
}

module.exports = {
  mapShiprocketStatus,
  shouldAdvanceStatus,
  STATUS_RANK,
};
