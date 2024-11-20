const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const db = require("../db");
const { requireGuest } = require("../middleware/auth");



router.get("/", requireGuest, (req, res) => {
  res.render("home", { req });
});

router.get("/register", requireGuest, (req, res) => {
  res.render("register", { req });
});


router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    await userService.create(username, email, password);
    res.redirect("/login");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.render("register", {
        req,
        error: "Username or email already exists. Please choose another.",
      });
    }
    console.error(err);
    res.render("register", {
      req,
      error: "An error occurred during registration.",
    });
  }
});

router.get("/login", requireGuest, (req, res) => {
  res.render("login", { req });
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await userService.authenticate(username, password);

    if (user) {
      req.session.userId = user.id;
      res.redirect("/dashboard");
    } else {
      res.render("login", {
        req,
        error: "Invalid username or password.",
      });
    }
  } catch (err) {
    res.render("login", {
      req,
      error: "An error occurred during login.",
    });
  }
});


router.post("/reset-progress", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  userService
    .resetProgress(req.session.userId) // Change User to userService
    .then(() => {
      res.redirect("/profile?reset=success");
    })
    .catch((err) => {
      console.error("Error resetting progress:", err);
      res.redirect("/profile?reset=error");
    });
});

router.get("/dashboard", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.userId;
    const userStats = await userService.getUserStats(userId); // Changed from User to userService

    const [userResults] = await db
      .promise()
      .query("SELECT username FROM users WHERE id = ?", [userId]);

    const [statsResults] = await db.promise().query(
      `SELECT 
        COUNT(DISTINCT p.exercise_id) as completed_exercises,
        (SELECT COUNT(*) FROM exercises) as total_exercises
       FROM progress p
       WHERE p.user_id = ?`,
      [userId]
    );

    const completedExercises = statsResults[0].completed_exercises;
    const totalExercises = statsResults[0].total_exercises;
    const progressPercentage =
      Math.round((completedExercises / totalExercises) * 100) || 0;

    const [allTopics] = await db.promise().query(
      `SELECT t.*, 
        IFNULL(ROUND(COUNT(DISTINCT p.exercise_id) * 100.0 / 
        (SELECT COUNT(*) FROM exercises WHERE topic_id = t.id), 1), 0) as completion_rate
       FROM topics t
       LEFT JOIN exercises e ON e.topic_id = t.id
       LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ?
       GROUP BY t.id
       ORDER BY t.name ASC`,
      [userId]
    );

    const recommendedTopics = allTopics
      .filter((topic) => topic.completion_rate < 100)
      .slice(0, 3);

    const [recentTopics] = await db.promise().query(
      `SELECT DISTINCT t.*, MAX(p.completed_at) as last_accessed
       FROM topics t
       JOIN exercises e ON e.topic_id = t.id
       JOIN progress p ON p.exercise_id = e.id
       WHERE p.user_id = ?
       GROUP BY t.id
       ORDER BY last_accessed DESC
       LIMIT 3`,
      [userId]
    );

    res.render("dashboard", {
      req,
      user: userResults[0],
      completedExercises,
      totalExercises,
      progressPercentage,
      recommendedTopics,
      recentTopics,
      topics: allTopics,
      userStats,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Error loading dashboard");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

router.get("/about", (req, res) => {
  res.render("about", { req });
});



router.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  db.query(
    "SELECT username, email, DATE_FORMAT(created_at, '%M %d, %Y') as joined_date FROM users WHERE id = ?",
    [req.session.userId],
    (err, results) => {
      if (err) throw err;
      res.render("profile", {
        req,
        user: results[0],
      });
    }
  );
});


module.exports = router;
