const syncService = require('../services/billingSyncService');

const syncData = async (req, res) => {
  try {
    const result = await syncService.syncAll();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 502).json({
      success: false,
      message: error.message || 'Billing sync failed.',
    });
  }
};

const syncProducts = async (_req, res) => {
  try {
    const result = await syncService.syncAll(true);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 502).json({
      success: false,
      message: error.message || 'Billing product refresh failed.',
    });
  }
};

module.exports = {
  syncData,
  syncProducts,
};
