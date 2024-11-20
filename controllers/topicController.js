const topicService = require("../services/topicService");

const index = async (req, res) => {
  try {
    const topics = await topicService.findAllTopics();
    res.render("topics", { topics, req });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading topics");
  }
};

const show = async (req, res) => {
  try {
    const topicDetails = await topicService.getTopicWithDetails(
      req.params.id,
      req.session.userId
    );

    if (!topicDetails) {
      return res.status(404).send("Topic not found");
    }

    res.render(
      `topics/${topicDetails.name.toLowerCase().replace(/\s+/g, "_")}/index`,
      {
        topic: topicDetails,
        prerequisites: topicDetails.prerequisites || [],
        exerciseGroups: topicDetails.exerciseGroups || [],
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
