const express = require('express');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const HistoryModel = require('../models/historyModel');

const router = express.Router();

router.get('/api/history', ensureAuthenticated, async (req, res) => {
  try {
    const rows = await HistoryModel.list(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error historial' });
  }
});

module.exports = router;