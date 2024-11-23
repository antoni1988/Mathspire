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

    // Check if topic view exists
    const viewPath = path.join(
      __dirname,
      "..",
      "views",
      "topics",
      topic.name.toLowerCase().replace(/\s+/g, "_"),
      "index.ejs"
    );

    if (!fs.existsSync(viewPath)) {
      req.session.errorMessage = `The topic "${topic.name}" is currently under development.`;
      return res.redirect("/dashboard");
    }

    res.render(
      `topics/${topic.name.toLowerCase().replace(/\s+/g, "_")}/index`,
      {
        topic,
        prerequisites: topic.prerequisites,
        exerciseGroups: topic.exerciseGroups,
        req,
      }
    );
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
