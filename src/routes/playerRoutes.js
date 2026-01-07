const express = require('express');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const SongModel = require('../models/songModel');
const HistoryModel = require('../models/historyModel');

const router = express.Router();

router.post('/api/play/:songId', ensureAuthenticated, async (req, res) => {
  try {
    const songId = Number(req.params.songId);
    const { source, playlist_id } = req.body || {};

    await SongModel.incrementPlayCount(songId);
    await HistoryModel.add({
      user_id: req.user.id,
      song_id: songId,
      source: source || 'catalog',
      playlist_id: playlist_id ? Number(playlist_id) : null
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registrando reproducción' });
  }
});

module.exports = router;