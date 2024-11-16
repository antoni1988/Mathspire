// models/topic.js
const db = require("../db");

class Topic {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
  }

  static async findAll() {
    const [rows] = await db.promise().query("SELECT * FROM topics");
    return rows.map((row) => new Topic(row));
  }

  static async findById(id) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM topics WHERE id = ?", [id]);
    return rows[0] ? new Topic(rows[0]) : null;
  }

  async getPrerequisites() {
    const [rows] = await db.promise().query(
      `SELECT t.* FROM topics t 
       JOIN topic_prerequisites tp ON t.id = tp.prerequisite_id 
       WHERE tp.topic_id = ?`,
      [this.id]
    );
    return rows.map((row) => new Topic(row));
  }

  async getExerciseGroups() {
    const [rows] = await db.promise().query(
      `SELECT 
      e.exercise_type,
      COUNT(*) as exercise_count,
      MIN(e.page_number) as first_page,
      COUNT(DISTINCT p.exercise_id) as completed_count
     FROM exercises e
     LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ?
     WHERE e.topic_id = ?
     GROUP BY e.exercise_type`,
      [this.userId, this.id]
    );
    return rows;
  }

  async getProgress(userId) {
    const [rows] = await db.promise().query(
      `SELECT COUNT(DISTINCT p.exercise_id) as completed,
       (SELECT COUNT(*) FROM exercises WHERE topic_id = ?) as total
       FROM progress p
       JOIN exercises e ON p.exercise_id = e.id 
       WHERE e.topic_id = ? AND p.user_id = ?`,
      [this.id, this.id, userId]
    );
    return {
      completed: rows[0].completed,
      total: rows[0].total,
      percentage: Math.round((rows[0].completed / rows[0].total) * 100) || 0,
    };
  }
}

module.exports = Topic;
