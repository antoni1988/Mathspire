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

  static async resetProgress(userId) {
    const [result] = await db
      .promise()
      .query("DELETE FROM progress WHERE user_id = ?", [userId]);
    return result;
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

  static async getUserStats(userId) {
    const [rows] = await db.promise().query(
      `SELECT 
      (SELECT COUNT(DISTINCT DATE(completed_at)) 
       FROM progress 
       WHERE user_id = ? AND completed_at >= (
         SELECT MAX(completed_at) FROM progress 
         WHERE user_id = ? AND DATE(completed_at) < CURDATE()
       )) as streak,
      (SELECT COUNT(*) 
       FROM progress 
       WHERE user_id = ? AND DATE(completed_at) = CURDATE()) as today_completed,
      (SELECT ROUND(AVG(daily_count), 1)
       FROM (
         SELECT DATE(completed_at) as day, COUNT(*) as daily_count
         FROM progress
         WHERE user_id = ?
         GROUP BY DATE(completed_at)
       ) as daily_stats) as average_daily`,
      [userId, userId, userId, userId]
    );

    return {
      streak: rows[0].streak || 0,
      todayCompleted: rows[0].today_completed || 0,
      averageDaily: Math.max(rows[0].average_daily || 5, 5), // Minimum target of 5
      exercisesToAverage: Math.max(
        rows[0].average_daily - rows[0].today_completed,
        0
      ),
    };
  }
  
}

module.exports = User;
