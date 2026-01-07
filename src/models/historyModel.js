const db = require('../config/db');

const HistoryModel = {
  add({ user_id, song_id, source, playlist_id }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO playback_history (user_id, song_id, source, playlist_id)
         VALUES (?, ?, ?, ?)`,
        [user_id, song_id, source || 'catalog', playlist_id || null],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  },

  list(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT h.played_at, h.source, h.playlist_id, s.*
         FROM playback_history h
         JOIN songs s ON s.id = h.song_id
         WHERE h.user_id = ?
         ORDER BY h.played_at DESC
         LIMIT 200`,
        [user_id],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }
};

module.exports = HistoryModel;