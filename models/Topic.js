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

  static async create(data) {
    const [result] = await db
      .promise()
      .query("INSERT INTO topics (name, description) VALUES (?, ?)", [
        data.name,
        data.description,
      ]);
    return result.insertId;
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
    const exercises = require("./data/exercises.json");
    const topicData = Object.values(exercises).find((t) => t.id === this.id);

    if (!topicData || !topicData.pages) {
      return [];
    }

    // Get completed exercises from database
    const [completedRows] = await db.promise().query(
      `SELECT e.id, e.page_number
     FROM exercises e
     JOIN progress p ON p.exercise_id = e.id 
     WHERE e.topic_id = ? AND p.user_id = ?`,
      [this.id, userId]
    );

    // Create groups by page
    const groups = topicData.pages.map((page, index) => {
      const pageNumber = index + 1;
      const completedCount = completedRows.filter(
        (row) => row.page_number === pageNumber
      ).length;

      return {
        page_title: page.title,
        exercise_count: page.exercises.length,
        first_page: pageNumber,
        completed_count: completedCount,
      };
    });

    this.exerciseGroups = groups;
    return groups;
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
