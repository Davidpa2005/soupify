const express = require('express');
const path = require('path');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const SongModel = require('../models/songModel');

const router = express.Router();

router.get('/catalog', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'catalog.html'));
});

router.get('/api/songs', ensureAuthenticated, async (req, res) => {
  try {
    const { q, genre, purpose, sort } = req.query;
    const songs = await SongModel.getAllSongs({ q, genre, purpose, sort });
    res.json(songs);
  } catch (err) {
    console.error('GET /api/songs:', err);
    res.status(500).json({ error: 'Error al obtener canciones' });
  }
});

router.get('/api/songs/filters', ensureAuthenticated, async (req, res) => {
  try {
    const genres = await SongModel.distinct('genre');
    const purposes = await SongModel.distinct('purpose');
    res.json({ genres, purposes });
  } catch (err) {
    console.error('GET /api/songs/filters:', err);
    res.status(500).json({ error: 'Error filtros' });
  }
});

router.post('/api/import-songs', ensureAuthenticated, async (req, res) => {
  try {
    const { songs } = req.body;
    if (!Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({ error: 'Debes enviar un array de canciones' });
    }
    await SongModel.upsertMany(songs);
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/import-songs:', err);
    res.status(500).json({ error: 'Error importando canciones' });
  }
});

module.exports = router;