const express = require('express');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const FavoriteModel = require('../models/favoriteModel');

const router = express.Router();

router.get('/api/favorites', ensureAuthenticated, async (req, res) => {
  try {
    const rows = await FavoriteModel.list(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error favoritos' });
  }
});

router.post('/api/favorites/toggle', ensureAuthenticated, async (req, res) => {
  try {
    const { song_id } = req.body;
    if (!song_id) return res.status(400).json({ error: 'song_id requerido' });

    const r = await FavoriteModel.toggle(req.user.id, Number(song_id));
    res.json({ ok: true, ...r });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error toggle favorito' });
  }
});

module.exports = router;