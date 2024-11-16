// models/exercise.js
const db = require("../db");

class Exercise {
  constructor(data) {
    this.id = data.id;
    this.topic_id = data.topic_id;
    this.exercise_number = data.exercise_number;
    this.exercise_type = data.exercise_type;
    this.page_number = data.page_number;
    this.completed_at = data.completed_at;
  }

  static async findByTopicAndPage(topicId, pageNumber, userId) {
    const [rows] = await db.promise().query(
      `SELECT e.*, p.completed_at 
       FROM exercises e 
       LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ? 
       WHERE e.topic_id = ? AND e.page_number = ?`,
      [userId, topicId, pageNumber]
    );
    return rows.map((row) => new Exercise(row));
  }

  static async countPages(topicId) {
    const [rows] = await db.promise().query(
      `SELECT COUNT(DISTINCT page_number) as total_pages 
       FROM exercises WHERE topic_id = ?`,
      [topicId]
    );
    return rows[0].total_pages;
  }

  async markComplete(userId) {
    const [result] = await db.promise().query(
      `INSERT INTO progress (user_id, exercise_id, completed_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP) 
       ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
      [userId, this.id]
    );
    return result;
  }
}

module.exports = Exercise;
