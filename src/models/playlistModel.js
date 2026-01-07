const db = require('../config/db');
const crypto = require('crypto');

function genToken() {
  return crypto.randomBytes(12).toString('hex');
}

const PlaylistModel = {
  create({ user_id, name, description, cover_url, is_public }) {
    return new Promise((resolve, reject) => {
      const share_token = genToken();
      db.run(
        `INSERT INTO playlists (user_id, name, description, cover_url, is_public, share_token)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, name, description || null, cover_url || null, is_public ? 1 : 0, share_token],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, share_token });
        }
      );
    });
  },

  update(playlist_id, user_id, data) {
    const fields = [];
    const params = [];

    const allowed = ['name','description','cover_url','is_public'];
    allowed.forEach(k => {
      if (typeof data[k] !== 'undefined') {
        fields.push(`${k} = ?`);
        params.push(k === 'is_public' ? (data[k] ? 1 : 0) : (data[k] === '' ? null : data[k]));
      }
    });

    if (fields.length === 0) return Promise.resolve();
    params.push(playlist_id, user_id);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE playlists
         SET ${fields.join(', ')},
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        params,
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  },

  delete(playlist_id, user_id) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`DELETE FROM playlist_songs WHERE playlist_id = ?`, [playlist_id]);
        db.run(`DELETE FROM playlists WHERE id = ? AND user_id = ?`, [playlist_id, user_id], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  },

  getMine(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.*,
           (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id = p.id) as song_count,
           (SELECT COALESCE(SUM(s.duration_ms),0)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id) as total_duration_ms
         FROM playlists p
         WHERE p.user_id = ?
         ORDER BY p.updated_at DESC`,
        [user_id],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  },

  getPublic() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.*,
           u.username as owner_username,
           (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id = p.id) as song_count,
           (SELECT COALESCE(SUM(s.duration_ms),0)
            FROM playlist_songs ps
            JOIN songs s ON s.id = ps.song_id
            WHERE ps.playlist_id = p.id) as total_duration_ms
         FROM playlists p
         JOIN users u ON u.id = p.user_id
         WHERE p.is_public = 1
         ORDER BY p.updated_at DESC
         LIMIT 100`,
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  },

  getById(playlist_id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM playlists WHERE id = ?`, [playlist_id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  },

  async getSongs(playlistId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT s.*
      FROM playlist_songs ps
      JOIN songs s ON s.id = ps.song_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.position ASC
      `,
      [playlistId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
},

  addSong({ playlist_id, user_id, song_id }) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM playlists WHERE id = ? AND user_id = ?`,
        [playlist_id, user_id],
        (err, p) => {
          if (err) return reject(err);
          if (!p) return reject(new Error('NO_OWNERSHIP'));

          db.get(
            `SELECT COALESCE(MAX(position), 0) as maxPos FROM playlist_songs WHERE playlist_id = ?`,
            [playlist_id],
            (err2, r) => {
              if (err2) return reject(err2);
              const nextPos = (r?.maxPos || 0) + 1;

              db.run(
                `INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position)
                 VALUES (?, ?, ?)`,
                [playlist_id, song_id, nextPos],
                function (err3) {
                  if (err3) return reject(err3);
                  resolve({ inserted: this.changes > 0 });
                }
              );
            }
          );
        }
      );
    });
  },

  removeSong({ playlist_id, user_id, song_id }) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM playlists WHERE id = ? AND user_id = ?`,
        [playlist_id, user_id],
        (err, p) => {
          if (err) return reject(err);
          if (!p) return reject(new Error('NO_OWNERSHIP'));

          db.run(
            `DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?`,
            [playlist_id, song_id],
            (err2) => {
              if (err2) return reject(err2);
              resolve();
            }
          );
        }
      );
    });
  },

  reorder({ playlist_id, user_id, ordered_song_ids }) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM playlists WHERE id = ? AND user_id = ?`,
        [playlist_id, user_id],
        (err, p) => {
          if (err) return reject(err);
          if (!p) return reject(new Error('NO_OWNERSHIP'));

          db.serialize(() => {
            const stmt = db.prepare(
              `UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?`
            );
            ordered_song_ids.forEach((songId, idx) => {
              stmt.run([idx + 1, playlist_id, songId]);
            });
            stmt.finalize((err2) => {
              if (err2) return reject(err2);
              resolve();
            });
          });
        }
      );
    });
  }
};

module.exports = PlaylistModel;