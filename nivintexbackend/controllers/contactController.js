const Contact = require('../models/Contact');
const sse = require('../utils/sse');

// ── Public ────────────────────────────────────────────────────────────────────

// POST /contact/submit
exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const newContact = await Contact.create({ name, email, phone, subject, message });

    // Broadcast to any SSE listeners (admin panel) so new messages appear instantly
    try {
      sse.sendEvent('contact', newContact);
    } catch (e) {
      // non-fatal
    }
    res.status(201).json({
      success: true,
      message: 'Request submitted successfully!',
      data: newContact,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Server-Sent Events stream for admin UI to listen for new contacts
exports.streamContacts = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // send a comment to keep connection alive
  res.write(':ok\n\n');
  sse.addClient(res);

  req.on('close', () => {
    sse.removeClient(res);
  });
};

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /contact/all?status=new
exports.getAllContacts = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    // pagination & sorting
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const orderDir = (req.query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Contact.findAndCountAll({
      where,
      order: [[sortBy, orderDir]],
      limit,
      offset,
    });

    res.status(200).json({ success: true, data: rows, meta: { total: count, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /contact/:id
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /contact/:id/status
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['new', 'read', 'replied'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    await contact.update({ status });

    res.status(200).json({
      success: true,
      message: `Status updated to "${status}"`,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /contact/:id
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    await contact.destroy();

    res.status(200).json({ success: true, message: 'Contact deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};