const exerciseService = require("../services/exerciseService");
const topicService = require("../services/topicService");

const show = async (req, res) => {
  try {
    const { id: topicId, exerciseId: pageNumber } = req.params;
    const userId = req.session.userId;

    const topic = await topicService.findTopicById(topicId);
    if (!topic) {
      return res.status(404).send("Topic not found");
    }

    const [totalPages, exercises] = await Promise.all([
      exerciseService.countPages(topicId),
      exerciseService.findByTopicAndPage(topicId, pageNumber, userId),
    ]);

    res.render("exercise_view", {
      Exercise: exerciseService,
      dbExercises: exercises,
      topicId,
      currentPage: parseInt(pageNumber),
      totalPages,
      req,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("An error occurred");
  }
};

const trackProgress = async (req, res) => {
  try {
    const { topicId, exerciseId } = req.params;
    const userId = req.session.userId;

    await exerciseService.markComplete(exerciseId, userId);
    res.status(200).send("Progress saved successfully");
  } catch (err) {
    console.error("Error saving progress:", err);
    res.status(500).send("Error saving progress");
  }
};

module.exports = {
  show,
  trackProgress,
};
