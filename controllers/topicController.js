const Topic = require("../models/Topic");
const path = require("path");
const fs = require("fs");

const index = async (req, res) => {
  try {
    const topics = await Topic.findAll();
    res.render("topics", { topics, req });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading topics");
  }
};

const show = async (req, res) => {
  try {
    const topic = await Topic.getWithDetails(req.params.id, req.session.userId);

    if (!topic) {
      req.session.errorMessage = "This topic is currently unavailable.";
      return res.redirect("/dashboard");
    }

    // Load topic content from JSON file
    const topicContent = require(`../models/data/topics/${topic.name
      .toLowerCase()
      .replace(/\s+/g, "_")}.json`);

    res.render("components/topic_template", {
      topic,
      prerequisites: topic.prerequisites,
      exerciseGroups: topic.exerciseGroups,
      introContent: topicContent.introContent,
      theorySections: topicContent.theorySections,
      req,
    });
  } catch (err) {
    console.error(err);
    req.session.errorMessage = "An error occurred while loading the topic.";
    res.redirect("/dashboard");
  }
};

module.exports = {
  index,
  show,
};
