const Exercise = require("../models/exercise");
const Topic = require("../models/topic");

class ExerciseController {
  static async show(req, res) {
    try {
      const { id: topicId, exerciseId: pageNumber } = req.params;
      const userId = req.session.userId;

      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).send("Topic not found");
      }

      const totalPages = await Exercise.countPages(topicId);
      const exercises = await Exercise.findByTopicAndPage(
        topicId,
        pageNumber,
        userId
      );
      const exerciseType = Exercise.getExerciseTypeByPage(pageNumber);

      res.render("exercise_view", {
        Exercise,
        dbExercises: exercises,
        topicId,
        exerciseType,
        currentPage: parseInt(pageNumber),
        totalPages,
        req,
      });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).send("An error occurred");
    }
  }

  static async trackProgress(req, res) {
    try {
      const { topicId, exerciseId } = req.params;
      const userId = req.session.userId;

      const exercise = new Exercise({ id: exerciseId });
      await exercise.markComplete(userId);

      res.status(200).send("Progress saved successfully");
    } catch (err) {
      console.error("Error saving progress:", err);
      res.status(500).send("Error saving progress");
    }
  }
}

module.exports = ExerciseController;
