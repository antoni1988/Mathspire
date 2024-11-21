const db = require("../db");

// Data access functions
const findAllTopics = async () => {
  const [rows] = await db.promise().query("SELECT * FROM topics");
  return rows;
};

const findTopicById = async (id) => {
  const [rows] = await db
    .promise()
    .query("SELECT * FROM topics WHERE id = ?", [id]);
  return rows[0];
};

const getPrerequisites = async (topicId) => {
  const [rows] = await db.promise().query(
    `SELECT t.* FROM topics t 
     JOIN topic_prerequisites tp ON t.id = tp.prerequisite_id 
     WHERE tp.topic_id = ?`,
    [topicId]
  );
  return rows;
};

const getExerciseGroups = async (topicId, userId) => {
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
    [userId, topicId]
  );
  return rows;
};



const getProgress = async (topicId, userId) => {
  const [rows] = await db.promise().query(
    `SELECT COUNT(DISTINCT p.exercise_id) as completed,
     (SELECT COUNT(*) FROM exercises WHERE topic_id = ?) as total
     FROM progress p
     JOIN exercises e ON p.exercise_id = e.id 
     WHERE e.topic_id = ? AND p.user_id = ?`,
    [topicId, topicId, userId]
  );
  return {
    completed: rows[0].completed,
    total: rows[0].total,
    percentage: Math.round((rows[0].completed / rows[0].total) * 100) || 0,
  };
};

const getTopicWithDetails = async (topicId, userId) => {
  const topic = await findTopicById(topicId);
  if (!topic) return null;

  const [prerequisites, progress, exerciseGroups] = await Promise.all([
    getPrerequisites(topicId),
    getProgress(topicId, userId),
    getExerciseGroups(topicId, userId),
  ]);

  return {
    ...topic,
    prerequisites,
    progress,
    exerciseGroups,
  };
};

module.exports = {
  findAllTopics,
  findTopicById,
  getTopicWithDetails,
  getPrerequisites,
  getProgress,
  getExerciseGroups,
};
