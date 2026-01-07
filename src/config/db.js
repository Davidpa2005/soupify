const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT,
      duration_ms INTEGER NOT NULL,
      cover_url TEXT,
      genre TEXT,
      purpose TEXT,
      year INTEGER,
      license TEXT NOT NULL,
      audio_url TEXT,
      play_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(title, artist)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      is_public INTEGER NOT NULL DEFAULT 0,
      share_token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS playlist_songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id),
      FOREIGN KEY (song_id) REFERENCES songs(id),
      UNIQUE(playlist_id, song_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (song_id) REFERENCES songs(id),
      UNIQUE(user_id, song_id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS playback_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      source TEXT,
      playlist_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (song_id) REFERENCES songs(id)
    );
  `);
});

module.exports = db;