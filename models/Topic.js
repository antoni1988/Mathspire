const db = require("../db");

class Topic {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.prerequisites = data.prerequisites || [];
    this.progress = data.progress || {};
    this.exerciseGroups = data.exerciseGroups || [];
  }

  // Basic CRUD operations
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

  // Prerequisites methods
  async getPrerequisites() {
    const [rows] = await db.promise().query(
      `SELECT t.* FROM topics t 
       JOIN topic_prerequisites tp ON t.id = tp.prerequisite_id 
       WHERE tp.topic_id = ?`,
      [this.id]
    );
    this.prerequisites = rows;
    return rows;
  }

  // Progress tracking
  async getProgress(userId) {
    const [rows] = await db.promise().query(
      `SELECT COUNT(DISTINCT p.exercise_id) as completed,
       (SELECT COUNT(*) FROM exercises WHERE topic_id = ?) as total
       FROM progress p
       JOIN exercises e ON p.exercise_id = e.id 
       WHERE e.topic_id = ? AND p.user_id = ?`,
      [this.id, this.id, userId]
    );

    this.progress = {
      completed: rows[0].completed,
      total: rows[0].total,
      percentage: Math.round((rows[0].completed / rows[0].total) * 100) || 0,
    };
    return this.progress;
  }

  // Exercise groups
  async getExerciseGroups(userId) {
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
      [userId, this.id]
    );
    this.exerciseGroups = rows;
    return rows;
  }

  // Load all details at once
  static async getWithDetails(topicId, userId) {
    const topic = await Topic.findById(topicId);
    if (!topic) return null;

    await Promise.all([
      topic.getPrerequisites(),
      topic.getProgress(userId),
      topic.getExerciseGroups(userId),
    ]);

    return topic;
  }
}

module.exports = Topic;
