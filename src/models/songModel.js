const db = require('../config/db');

function rowToSong(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    duration_ms: row.duration_ms,
    cover_url: row.cover_url,
    genre: row.genre,
    purpose: row.purpose,
    year: row.year,
    license: row.license,
    audio_url: row.audio_url,
    play_count: row.play_count
  };
}

const SongModel = {
  getAllSongs({ q, genre, purpose, sort } = {}) {
    return new Promise((resolve, reject) => {
      const params = [];
      let where = `WHERE 1=1`;

      if (q) {
        where += ` AND (title LIKE ? OR artist LIKE ? OR album LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }
      if (genre) {
        where += ` AND genre = ?`;
        params.push(genre);
      }
      if (purpose) {
        where += ` AND purpose = ?`;
        params.push(purpose);
      }

      let orderBy = `ORDER BY id DESC`;
      if (sort === 'most_played') orderBy = `ORDER BY play_count DESC, id DESC`;

      db.all(
        `SELECT * FROM songs ${where} ${orderBy} LIMIT 200`,
        params,
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows.map(rowToSong));
        }
      );
    });
  },

  findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM songs WHERE id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(rowToSong(row));
      });
    });
  },

  createSong(songData) {
    const {
      title, artist, album, duration_ms,
      cover_url, genre, purpose, year, license, audio_url
    } = songData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO songs (title, artist, album, duration_ms, cover_url, genre, purpose, year, license, audio_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          artist,
          album || null,
          duration_ms || 0,
          cover_url || null,
          genre || null,
          purpose || null,
          year || null,
          license || 'CC0',
          audio_url || null
        ],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID });
        }
      );
    });
  },

  updateSong(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      'title','artist','album','duration_ms','cover_url','genre','purpose','year','license','audio_url'
    ];

    allowed.forEach(k => {
      if (typeof data[k] !== 'undefined') {
        fields.push(`${k} = ?`);
        params.push(data[k] === '' ? null : data[k]);
      }
    });

    if (fields.length === 0) return Promise.resolve();
    params.push(id);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE songs SET ${fields.join(', ')} WHERE id = ?`,
        params,
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  },

  deleteSong(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM songs WHERE id = ?`, [id], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },

  incrementPlayCount(id) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE songs SET play_count = play_count + 1 WHERE id = ?`,
        [id],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  },

  upsertMany(songs) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO songs
          (title, artist, album, duration_ms, cover_url, genre, purpose, year, license, audio_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(title, artist) DO UPDATE SET
          album = COALESCE(excluded.album, songs.album),
          duration_ms = CASE
            WHEN excluded.duration_ms IS NOT NULL AND excluded.duration_ms != 0 THEN excluded.duration_ms
            ELSE songs.duration_ms
          END,
          cover_url = COALESCE(excluded.cover_url, songs.cover_url),
          genre = COALESCE(excluded.genre, songs.genre),
          purpose = COALESCE(excluded.purpose, songs.purpose),
          year = COALESCE(excluded.year, songs.year),
          license = COALESCE(excluded.license, songs.license),
          audio_url = CASE
            WHEN (songs.audio_url IS NULL OR songs.audio_url = '') AND (excluded.audio_url IS NOT NULL AND excluded.audio_url != '')
              THEN excluded.audio_url
            ELSE songs.audio_url
          END
      `);

      for (const s of songs) {
        stmt.run([
          s.title,
          s.artist,
          s.album || null,
          s.duration_ms || 0,
          s.cover_url || null,
          s.genre || null,
          s.purpose || null,
          s.year || null,
          s.license || 'CC0',
          s.audio_url || null
        ]);
      }

      stmt.finalize((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
},

  distinct(field) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT DISTINCT ${field} as v FROM songs WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY v ASC`,
        [],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows.map(r => r.v));
        }
      );
    });
  }
};

module.exports = SongModel;