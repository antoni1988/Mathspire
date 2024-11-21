const Topic = require("../models/Topic");

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
      return res.status(404).send("Topic not found");
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
    res.status(500).send("Error loading topic");
  }
};

module.exports = {
  index,
  show,
};
