const express = require("express");
const router = express.Router();
const db = require("../db");
const TopicController = require("../controllers/topicController");
const ExerciseController = require("../controllers/exerciseController");
const { requireLogin } = require("../middleware/auth");


router.use(express.json());

// require login for all routes
router.use(requireLogin);

router.get("/", TopicController.index);
router.get("/:id", TopicController.show);

router.get("/:id/exercises/:exerciseId", ExerciseController.show);
router.post(
  "/:topicId/exercises/:exerciseId",
  ExerciseController.trackProgress
);


module.exports = router;
