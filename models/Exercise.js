const db = require("../db");

class Exercise {
  constructor(data) {
    this.id = data.id;
    this.topic_id = data.topic_id;
    this.exercise_number = data.exercise_number;
    this.exercise_type = data.exercise_type;
    this.page_number = data.page_number;
    this.completed_at = data.completed_at;
    this.type = data.type;
    this.question = data.question;
    this.options = data.options;
    this.answer = data.answer;
  }

  static async findByTopicId(topicId) {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM exercises WHERE topic_id = ?", [topicId]);
    return rows.map((row) => new Exercise(row));
  }

  static async create(data) {
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO exercises (topic_id, type, question, options, answer) VALUES (?, ?, ?, ?, ?)",
        [data.topic_id, data.type, data.question, data.options, data.answer]
      );
    return { id: result.insertId, ...data };
  }

  // Database operations
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
      const exercises = require("./data/exercises.json");
      const topic = Object.values(exercises).find(
        (t) => t.id === parseInt(topicId)
      );
      return topic ? topic.pages.length : 0;
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

  static getExerciseData(topicId, pageNumber) {
    const exercises = require("./data/exercises.json");
    const topicData = Object.values(exercises).find(t => t.id === parseInt(topicId));
    if (!topicData) return null;

    const pages = topicData.pages;
    if (!pages || !pages.length || !pages[pageNumber - 1]) return null;

    const page = pages[pageNumber - 1];

    return {
      pageTitle: page.title,
      topicName: topicData.name,
      exercises: page.exercises
    };
  }

}

module.exports = Exercise;
