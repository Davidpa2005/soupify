const express = require('express');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const PlaylistModel = require('../models/playlistModel');

const router = express.Router();

router.get('/api/playlists', ensureAuthenticated, async (req, res) => {
  try {
    const rows = await PlaylistModel.getMine(req.user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error playlists' });
  }
});

router.get('/api/playlists/public', ensureAuthenticated, async (req, res) => {
  try {
    const rows = await PlaylistModel.getPublic();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error playlists públicas' });
  }
});

router.post('/api/playlists', ensureAuthenticated, async (req, res) => {
  try {
    const { name, description, cover_url, is_public } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre requerido' });

    const created = await PlaylistModel.create({
      user_id: req.user.id,
      name: name.trim(),
      description,
      cover_url,
      is_public: !!is_public
    });

    res.json({ ok: true, ...created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando playlist' });
  }
});

router.put('/api/playlists/:id', ensureAuthenticated, async (req, res) => {
  try {
    await PlaylistModel.update(Number(req.params.id), req.user.id, req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error editando playlist' });
  }
});

router.delete('/api/playlists/:id', ensureAuthenticated, async (req, res) => {
  try {
    await PlaylistModel.delete(Number(req.params.id), req.user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error borrando playlist' });
  }
});

router.get('/api/playlists/:id/songs', ensureAuthenticated, async (req, res) => {
  try {
    const pid = Number(req.params.id);
    const p = await PlaylistModel.getById(pid);
    if (!p) return res.status(404).json({ error: 'Playlist no existe' });

    const isOwner = p.user_id === req.user.id;
    const isPublic = p.is_public === 1;
    if (!isOwner && !isPublic) return res.status(403).json({ error: 'No autorizado' });

    const songs = await PlaylistModel.getSongs(pid);
    res.json({ playlist: p, songs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error cargando playlist' });
  }
});

router.post('/api/playlists/:id/songs', ensureAuthenticated, async (req, res) => {
  try {
    const pid = Number(req.params.id);
    const { song_id } = req.body;
    if (!song_id) return res.status(400).json({ error: 'song_id requerido' });

    const result = await PlaylistModel.addSong({
      playlist_id: pid,
      user_id: req.user.id,
      song_id: Number(song_id)
    });

    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    if (err.message === 'NO_OWNERSHIP') return res.status(403).json({ error: 'No autorizado' });
    res.status(500).json({ error: 'Error añadiendo canción' });
  }
});

router.delete('/api/playlists/:id/songs/:songId', ensureAuthenticated, async (req, res) => {
  try {
    await PlaylistModel.removeSong({
      playlist_id: Number(req.params.id),
      user_id: req.user.id,
      song_id: Number(req.params.songId)
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    if (err.message === 'NO_OWNERSHIP') return res.status(403).json({ error: 'No autorizado' });
    res.status(500).json({ error: 'Error quitando canción' });
  }
});

router.put('/api/playlists/:id/reorder', ensureAuthenticated, async (req, res) => {
  try {
    const ordered_song_ids = req.body.ordered_song_ids;
    if (!Array.isArray(ordered_song_ids)) {
      return res.status(400).json({ error: 'ordered_song_ids debe ser array' });
    }

    await PlaylistModel.reorder({
      playlist_id: Number(req.params.id),
      user_id: req.user.id,
      ordered_song_ids: ordered_song_ids.map(Number)
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    if (err.message === 'NO_OWNERSHIP') return res.status(403).json({ error: 'No autorizado' });
    res.status(500).json({ error: 'Error reordenando' });
  }
});

module.exports = router;