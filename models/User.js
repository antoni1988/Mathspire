const db = require("../db");
const bcrypt = require("bcrypt");

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.created_at = data.created_at;
    this.is_admin = !!data.is_admin;
  }

  // Basic CRUD operations
  static async create(username, email, password) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db
      .promise()
      .query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [
        username,
        email,
        hash,
      ]);
    return result;
  }

  static async findById(id) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] ? new User(rows[0]) : null;
  }

  isAdmin() {
    return this.is_admin;
  }
  

  static async findByUsername(username) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM users WHERE username = ?", [username]);
    return rows[0] ? new User(rows[0]) : null;
  }

  // Authentication
  static async authenticate(username, password) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];
    if (!user) return null;

    const match = await bcrypt.compare(password, user.password);
    return match ? new User(user) : null;
  }

  // Progress tracking
  async resetProgress() {
    const [result] = await db
      .promise()
      .query("DELETE FROM progress WHERE user_id = ?", [this.id]);
    return result;
  }

  async getDashboardData() {
    const [statsResults] = await db.promise().query(
      `SELECT 
        COUNT(DISTINCT p.exercise_id) as completed_exercises,
        (SELECT COUNT(*) FROM exercises) as total_exercises
       FROM progress p
       WHERE p.user_id = ?`,
      [this.id]
    );

    const [allTopics] = await db.promise().query(
      `SELECT t.*, 
        IFNULL(ROUND(COUNT(DISTINCT p.exercise_id) * 100.0 / 
        (SELECT COUNT(*) FROM exercises WHERE topic_id = t.id), 1), 0) as completion_rate
       FROM topics t
       LEFT JOIN exercises e ON e.topic_id = t.id
       LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ?
       GROUP BY t.id
       ORDER BY t.name ASC`,
      [this.id]
    );

    const [recentTopics] = await db.promise().query(
      `SELECT DISTINCT t.*, MAX(p.completed_at) as last_accessed
       FROM topics t
       JOIN exercises e ON e.topic_id = t.id
       JOIN progress p ON p.exercise_id = e.id
       WHERE p.user_id = ?
       GROUP BY t.id
       ORDER BY last_accessed DESC
       LIMIT 3`,
      [this.id]
    );

    const stats = await this.getStats();

    return {
      stats,
      completedExercises: statsResults[0].completed_exercises || 0,
      totalExercises: statsResults[0].total_exercises || 0,
      progressPercentage:
        Math.round(
          (statsResults[0].completed_exercises /
            statsResults[0].total_exercises) *
            100
        ) || 0,
      recommendedTopics: allTopics
        .filter((t) => t.completion_rate < 100)
        .slice(0, 3),
      recentTopics,
      topics: allTopics,
      userStats: stats,
    };
  }

  async getStats() {
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
      [this.id, this.id, this.id, this.id]
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
  }

  async getProfile() {
    const [rows] = await db.promise().query(
      `SELECT username, email, DATE_FORMAT(created_at, '%M %d, %Y') as joined_date 
       FROM users WHERE id = ?`,
      [this.id]
    );
    return rows[0];
  }
}

module.exports = User;
