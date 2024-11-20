const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topicController");
const exerciseController = require("../controllers/exerciseController");
const { requireLogin } = require("../middleware/auth");

router.use(express.json());
router.use(requireLogin);

router.get("/", topicController.index);
router.get("/:id", topicController.show);
router.get("/:id/exercises/:exerciseId", exerciseController.show);
router.post(
  "/:topicId/exercises/:exerciseId",
  exerciseController.trackProgress
);

module.exports = router;
