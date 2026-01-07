const db = require('../config/db');

const UserModel = {
  createUser: (username, email, passwordHash, role = 'User') => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `;
      db.run(sql, [username, email, passwordHash, role], function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, username, email, role });
      });
    });
  },

  findByEmailOrUsername: (identifier) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM users
        WHERE email = ? OR username = ?
        LIMIT 1
      `;
      db.get(sql, [identifier, identifier], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
      db.get(sql, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
};

module.exports = UserModel;