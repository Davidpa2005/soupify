const db = require('../config/db');

const StatsModel = {
  global() {
    return new Promise((resolve, reject) => {
      const out = {};
      db.get(`SELECT COUNT(*) as users FROM users`, [], (e1, r1) => {
        if (e1) return reject(e1);
        out.users = r1.users;

        db.get(`SELECT COUNT(*) as songs FROM songs`, [], (e2, r2) => {
          if (e2) return reject(e2);
          out.songs = r2.songs;

          db.get(`SELECT COUNT(*) as playlists FROM playlists`, [], (e3, r3) => {
            if (e3) return reject(e3);
            out.playlists = r3.playlists;

            db.all(
              `SELECT title, artist, play_count
               FROM songs
               ORDER BY play_count DESC
               LIMIT 10`,
              [],
              (e4, r4) => {
                if (e4) return reject(e4);
                out.topSongs = r4;
                resolve(out);
              }
            );
          });
        });
      });
    });
  }
};

module.exports = StatsModel;