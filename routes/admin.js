const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/auth");
const Topic = require("../models/Topic");
const Exercise = require("../models/Exercise");

// Admin middleware
const requireAdmin = async (req, res, next) => {
  if (!req.user?.isAdmin()) {
    return res.status(403).redirect("/");
  }
  next();
};

// Use both auth middlewares
router.use(requireLogin);
router.use(requireAdmin);

// Admin routes
router.get("/topics", async (req, res) => {
  try {
    const topics = await Topic.findAll();
    res.render("admin/topics", { req, topics });
  } catch (err) {
    console.error("Error loading topics:", err);
    res.status(500).send("Error loading topics");
  }
});

router.post("/topics", async (req, res) => {
  try {
    const { name, description } = req.body;
    const topic = await Topic.create({ name, description });
    res.redirect("/admin/topics");
  } catch (err) {
    console.error("Error creating topic:", err);
    res.status(500).send("Error creating topic");
  }
});


router.get("/topics/:id/edit", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    const exercises = await Exercise.findByTopicId(topic.id);
    res.render("admin/topic_edit", { req, topic, exercises });
  } catch (err) {
    console.error("Error loading topic:", err);
    res.status(500).send("Error loading topic");
  }
});

router.post("/topics/:id/exercises", async (req, res) => {
  try {
    const { type, question, options, answer } = req.body;
    const exercise = await Exercise.create({
      topic_id: req.params.id,
      type,
      question,
      options: JSON.stringify(options),
      answer,
    });
    res.json(exercise);
  } catch (err) {
    console.error("Error creating exercise:", err);
    res.status(500).json({ error: "Error creating exercise" });
  }
});


router.delete("/topics/:topicId/exercises/:exerciseId", async (req, res) => {
  try {
    await Exercise.delete(req.params.exerciseId);
    res.sendStatus(200);
  } catch (err) {
    console.error("Error deleting exercise:", err);
    res.status(500).json({ error: "Error deleting exercise" });
  }
});



router.get("/topics/new", (req, res) => {
  res.render("admin/topic_new", { req });
});

router.get("/topics/:id/exercises", (req, res) => {
  res.render("admin/topic_exercises", { req });
});

module.exports = router;
