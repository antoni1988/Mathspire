const db = require("../db");
const exercises = require("../models/data/exercises.json");

// Data access functions
const findByTopicAndPage = async (topicId, pageNumber, userId) => {
  const [rows] = await db.promise().query(
    `SELECT e.*, p.completed_at 
     FROM exercises e 
     LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ? 
     WHERE e.topic_id = ? AND e.page_number = ?`,
    [userId, topicId, pageNumber]
  );
  return rows;
};

const countPages = async (topicId) => {
  const [rows] = await db.promise().query(
    `SELECT COUNT(DISTINCT page_number) as total_pages 
     FROM exercises WHERE topic_id = ?`,
    [topicId]
  );
  return rows[0].total_pages;
};

const markComplete = async (exerciseId, userId) => {
  const [result] = await db.promise().query(
    `INSERT INTO progress (user_id, exercise_id, completed_at) 
     VALUES (?, ?, CURRENT_TIMESTAMP) 
     ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
    [userId, exerciseId]
  );
  return result;
};

// Business logic functions
const getPageExercises = (topicId, pageNumber) => {
  const topicData = Object.values(exercises).find(
    (t) => t.id === parseInt(topicId)
  );
  if (!topicData) return null;

  const pages = Object.values(topicData.pages);
  const page = pages[pageNumber - 1];
  if (!page) return null;

  return {
    pageTitle: page.title,
    topicName: topicData.name,
    exercises: page.exercises,
  };
};

const getRandomExercise = (topicId, pageName) => {
  const page = getPageExercises(topicId, pageName);
  if (!page) return null;
  const exercises = page.exercises;
  return exercises[Math.floor(Math.random() * exercises.length)];
};

module.exports = {
  findByTopicAndPage,
  countPages,
  markComplete,
  getPageExercises,
  getRandomExercise,
};
