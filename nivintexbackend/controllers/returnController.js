// controllers/returnController.js
const Return   = require('../models/Return');
const Order    = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product   = require('../models/Product');
const Razorpay = require('razorpay');
const { sendOrderStatusEmail }   = require('../services/emailService');

let razorpayClient = null;
const getRazorpay = () => {
  if (!razorpayClient) {
    if (!process.env.RAZORPAY_KEY || !process.env.RAZORPAY_SECRET) {
      throw new Error('Razorpay credentials are not configured (RAZORPAY_KEY / RAZORPAY_SECRET).');
    }
    razorpayClient = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET,
    });
  }
  return razorpayClient;
};

// ─────────────────────────────────────────
// 📥 Customer Return Request
// POST /api/returns/request
// ─────────────────────────────────────────
exports.requestReturn = async (req, res) => {
  try {
    const { order_id, reason } = req.body;

    if (!order_id || !reason) {
      return res.status(400).json({ success: false, message: 'order_id and reason required' });
    }

    const order = await Order.findByPk(order_id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be returned',
      });
    }

    const existing = await Return.findOne({ where: { order_id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Return already requested for this order' });
    }

    const returnRequest = await Return.create({
      order_id,
      customer_id:    order.customer_id,
      customer_name:  order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      reason,
      status: 'requested',
    });

    await order.update({ status: 'return_requested' });

    // ✅ Email: notify customer return received
    await sendOrderStatusEmail(order, 'return_requested');

    return res.json({ success: true, return: returnRequest });

  } catch (err) {
    console.error('❌ requestReturn error:', err);
    return res.status(500).json({ success: false, message: 'Return request failed' });
  }
};

// ─────────────────────────────────────────
// ✅ Admin Approve Return
// POST /api/returns/:id/approve
// ─────────────────────────────────────────
exports.approveReturn = async (req, res) => {
  try {
    const returnRequest = await Return.findByPk(req.params.id);
    if (!returnRequest) return res.status(404).json({ success: false, message: 'Return not found' });
    if (returnRequest.status !== 'requested') return res.status(400).json({ success: false, message: 'Return already processed' });

    const order = await Order.findByPk(returnRequest.order_id);
    if (!order) return res.status(404).json({ success: false, message: 'Associated order not found' });

    await returnRequest.update({ status: 'approved' });
    await order.update({ status: 'return_approved' });

    await sendOrderStatusEmail(order, 'return_approved');
    return res.json({ success: true, return: returnRequest });

  } catch (err) {
    console.error('❌ approveReturn error:', err);
    return res.status(500).json({ success: false, message: 'Approve failed' });
  }
};
// ─────────────────────────────────────────
// ❌ Admin Reject Return
// POST /api/returns/:id/reject
// ─────────────────────────────────────────
exports.rejectReturn = async (req, res) => {
  try {
    const returnRequest = await Return.findByPk(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    await returnRequest.update({ status: 'rejected' });
    await Order.update({ status: 'delivered' }, { where: { id: returnRequest.order_id } });

    // ✅ Email: notify customer return rejected
    const order = await Order.findByPk(returnRequest.order_id);
    if (order) {
      await sendOrderStatusEmail(
        { ...order.toJSON(), customer_email: returnRequest.customer_email },
        'cancelled' // reuse cancelled template for rejection
      );
    }

    return res.json({ success: true });

  } catch (err) {
    console.error('❌ rejectReturn error:', err);
    return res.status(500).json({ success: false, message: 'Reject failed' });
  }
};

// ─────────────────────────────────────────
// 💰 Admin Process Refund (Razorpay) — Manual
// POST /api/returns/:id/refund
// ─────────────────────────────────────────
exports.processRefund = async (req, res) => {
  try {
    const returnRequest = await Return.findByPk(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Return not found' });
    }

    if (returnRequest.refund_id) {
      return res.status(400).json({ success: false, message: 'Refund already processed' });
    }

    const order = await Order.findByPk(returnRequest.order_id);

    if (!order.payment_id) {
      return res.status(400).json({ success: false, message: 'No payment_id found for this order' });
    }

    const refundAmount = Math.round((req.body.amount || order.total) * 100);

    const refund = await getRazorpay().payments.refund(order.payment_id, {
      amount: refundAmount,
      notes: {
        reason:   returnRequest.reason,
        order_id: String(order.id),
      },
    });

    await returnRequest.update({
      status:        'refunded',
      refund_id:     refund.id,
      refund_amount: refund.amount / 100,
      refund_status: refund.status,
    });

    // Restore stock on refund
    const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
    for (const item of orderItems) {
        const product = await Product.findByPk(item.product_id);
        if (product) {
            await product.update({ stock: (product.stock || 0) + (item.quantity || 1) });
        }
    }

    await order.update({ status: 'refunded' });

    // ✅ Email: notify customer refund processed
    await sendOrderStatusEmail(order, 'refunded', {
      refund_id:     refund.id,
      refund_amount: refund.amount / 100,
    });

    console.log(`✅ Manual refund processed: ${refund.id} for Order #${order.id}`);
    return res.json({ success: true, refund });

  } catch (err) {
    console.error('❌ processRefund error:', err?.error || err);
    return res.status(500).json({
      success: false,
      message: err?.error?.description || 'Refund failed',
    });
  }
};

// ─────────────────────────────────────────
// 📋 Get All Returns (Admin)
// GET /api/returns
// ─────────────────────────────────────────
exports.getAllReturns = async (req, res) => {
  try {
    const returns = await Return.findAll({
      include: [{ model: Order, attributes: ['id', 'total', 'payment_id', 'customer_name'] }],
      order:   [['createdAt', 'DESC']],
    });
    return res.json({ success: true, returns });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────
// 👤 Get Customer Returns
// GET /api/returns/customer/:id
// ─────────────────────────────────────────
exports.getCustomerReturns = async (req, res) => {
  try {
    const returns = await Return.findAll({
      where: { customer_id: req.params.id },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ success: true, returns });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};