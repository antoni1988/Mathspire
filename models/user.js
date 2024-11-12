const db = require("../db");
const bcrypt = require("bcrypt");

class User {
  static create(username, password, callback) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return callback(err);
      db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hash],
        callback
      );
    });
  }

  static findByUsername(username, callback) {
    db.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]);
      }
    );
  }

  static authenticate(username, password, callback) {
    this.findByUsername(username, (err, user) => {
      if (err) return callback(err);
      if (!user) return callback(null, false);
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) return callback(err);
        callback(null, result ? user : false);
      });
    });
  }
}

module.exports = User;
