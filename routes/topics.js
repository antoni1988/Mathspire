const express = require("express");
const router = express.Router();
const db = require("../db");

router.use(express.json());

// Authentication middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

// List topics
router.get("/", requireLogin, (req, res) => {
  db.query("SELECT * FROM topics", (err, topics) => {
    if (err) throw err;
    res.render("topics", { topics, req });
  });
});

// Show topic and exercises
// routes/topics.js
router.get("/:id", requireLogin, async (req, res) => {
  const topicId = req.params.id;
  const userId = req.session.userId;

  try {
    // Get topic and calculate progress
    const [topic] = await db
      .promise()
      .query("SELECT * FROM topics WHERE id = ?", [topicId]);

    // Check prerequisites
    const [prerequisites] = await db.promise().query(
      `SELECT t.* FROM topics t 
       JOIN topic_prerequisites tp ON t.id = tp.prerequisite_id 
       WHERE tp.topic_id = ?`,
      [topicId]
    );

    // Use proper template name and path
    const templateName = topic[0].name.toLowerCase().replace(/\s+/g, "_");
    res.render(`topics/${templateName}/index`, {
      topic: topic[0],
      prerequisites,
      req,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

// Update the route handler to be async
router.get("/:id/exercises/:exerciseId", requireLogin, async (req, res) => {
  const topicId = req.params.id;
  const userId = req.session.userId;
  const currentPage = parseInt(req.params.exerciseId);

  try {
    // Get total number of exercise pages for this topic
    const [pageCount] = await db.promise().query(
      `SELECT COUNT(DISTINCT page_number) as total_pages 
       FROM exercises 
       WHERE topic_id = ?`,
      [topicId]
    );

    const totalPages = pageCount[0].total_pages;

    // Get exercises and progress data
    const [dbExercises] = await db.promise().query(
      `SELECT e.id, e.exercise_number, p.completed_at 
       FROM exercises e 
       LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ? 
       WHERE e.topic_id = ? AND e.page_number = ?`,
      [userId, topicId, currentPage]
    );

    res.render(`topics/quadratic_equations/exercise${currentPage}`, {
      dbExercises,
      req,
      topicId,
      currentPage,
      totalPages,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("An error occurred");
  }
});

router.post(
  "/:topicId/exercises/:exerciseId",
  requireLogin,
  async (req, res) => {
    const { topicId, exerciseId } = req.params;
    const userId = req.session.userId;

    try {
      // First check if this exercise exists
      const [exercise] = await db
        .promise()
        .query("SELECT * FROM exercises WHERE topic_id = ? AND id = ?", [
          topicId,
          exerciseId,
        ]);

      if (!exercise.length) {
        return res.status(404).send("Exercise not found");
      }

      // Check if progress already exists
      const [existing] = await db
        .promise()
        .query("SELECT * FROM progress WHERE user_id = ? AND exercise_id = ?", [
          userId,
          exerciseId,
        ]);

      if (existing.length) {
        return res.status(200).send("Progress already recorded");
      }

      // Track new progress
      await db.trackProgress(userId, exerciseId);
      res.status(200).send("Progress saved successfully");
    } catch (err) {
      console.error("Error saving progress:", err);
      res.status(500).send("Error saving progress");
    }
  }
);

module.exports = router;
