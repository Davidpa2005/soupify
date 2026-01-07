const db = require('../config/db');

const FavoriteModel = {
  toggle(user_id, song_id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM favorites WHERE user_id = ? AND song_id = ?`,
        [user_id, song_id],
        (err, row) => {
          if (err) return reject(err);

          if (row) {
            db.run(`DELETE FROM favorites WHERE id = ?`, [row.id], (err2) => {
              if (err2) return reject(err2);
              resolve({ is_favorite: false });
            });
          } else {
            db.run(
              `INSERT INTO favorites (user_id, song_id) VALUES (?, ?)`,
              [user_id, song_id],
              (err2) => {
                if (err2) return reject(err2);
                resolve({ is_favorite: true });
              }
            );
          }
        }
      );
    });
  },

  list(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.*
         FROM favorites f
         JOIN songs s ON s.id = f.song_id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`,
        [user_id],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }
};

module.exports = FavoriteModel;