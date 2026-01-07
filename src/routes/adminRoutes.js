// src/routes/adminRoutes.js
const express = require("express");
const path = require("path");
const router = express.Router();

const db = require("../config/db");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const { ensureAdmin } = require("../middleware/adminMiddleware");

// Helpers
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

// ✅ Vista admin (HTML)
router.get("/admin", ensureAuthenticated, ensureAdmin, (req, res) => {
  // Ajusta si tu carpeta public está en otro sitio
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

// ✅ Stats
router.get("/api/admin/stats", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // OJO: tu tabla de usuarios puede no llamarse users.
    // Si te falla, dime el resultado de: .tables
    const users = await get("SELECT COUNT(*) as n FROM users").catch(() => ({ n: null }));
    const songs = await get("SELECT COUNT(*) as n FROM songs");
    const playlists = await get("SELECT COUNT(*) as n FROM playlists");

    res.json({
      users: users.n, // puede ser null si tu tabla no es users
      songs: songs.n,
      playlists: playlists.n
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error stats" });
  }
});

// ✅ Listado canciones (simple)
router.get("/api/admin/songs", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const rows = await all(`
      SELECT id, title, artist, album, genre, play_count, audio_url
      FROM songs
      ORDER BY id DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error songs" });
  }
});

// ✅ Borrar canción (y limpiar relaciones)
router.delete("/api/admin/songs/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await run("DELETE FROM playlist_songs WHERE song_id = ?", [id]);
    await run("DELETE FROM favorites WHERE song_id = ?", [id]).catch(() => {});
    await run("DELETE FROM history WHERE song_id = ?", [id]).catch(() => {});
    const r = await run("DELETE FROM songs WHERE id = ?", [id]);

    res.json({ ok: true, deleted: r.changes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error delete song" });
  }
});

// ✅ Listado playlists
router.get("/api/admin/playlists", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const rows = await all(`
      SELECT id, user_id, name, is_public, created_at
      FROM playlists
      ORDER BY id DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error playlists" });
  }
});

// ✅ Borrar playlist (y limpiar playlist_songs)
router.delete("/api/admin/playlists/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await run("DELETE FROM playlist_songs WHERE playlist_id = ?", [id]);
    const r = await run("DELETE FROM playlists WHERE id = ?", [id]);
    res.json({ ok: true, deleted: r.changes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error delete playlist" });
  }
});

module.exports = router;