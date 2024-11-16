const Topic = require("../models/topic");

class TopicController {
  static async index(req, res) {
    try {
      const topics = await Topic.findAll();
      res.render("topics", { topics, req });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error loading topics");
    }
  }

  static async show(req, res) {
    try {
      const topic = await Topic.findById(req.params.id);
      if (!topic) return res.status(404).send("Topic not found");

      topic.userId = req.session.userId; // Add this line to set userId

      const prerequisites = await topic.getPrerequisites();
      const progress = await topic.getProgress(req.session.userId);
      const exerciseGroups = await topic.getExerciseGroups();

      const templateName = topic.name.toLowerCase().replace(/\s+/g, "_");
      res.render(`topics/${templateName}/index`, {
        topic,
        prerequisites,
        progress,
        exerciseGroups,
        req,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error loading topic");
    }
  }
}

module.exports = TopicController;
