const db = require("../db");
const bcrypt = require("bcrypt");

const create = async (username, email, password) => {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db
    .promise()
    .query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [
      username,
      email,
      hash,
    ]);
  return result;
};

const findByUsername = async (username) => {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM users WHERE username = ?", [username]); // Fixed query
  return rows[0];
};

const resetProgress = async (userId) => {
  const [result] = await db
    .promise()
    .query("DELETE FROM progress WHERE user_id = ?", [userId]);
  return result;
};

// Business logic functions
const authenticate = async (username, password) => {
  const user = await findByUsername(username);
  if (!user) return false;

  const match = await bcrypt.compare(password, user.password);
  return match ? user : false;
};

const getUserStats = async (userId) => {
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
    averageDaily: Math.max(rows[0].average_daily || 5, 5),
    exercisesToAverage: Math.max(
      rows[0].average_daily - rows[0].today_completed,
      0
    ),
  };
};

module.exports = {
  create,
  findByUsername,
  resetProgress,
  authenticate,
  getUserStats,
};
