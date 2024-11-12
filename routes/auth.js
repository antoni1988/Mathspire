const express = require("express");
const router = express.Router();
const User = require("../models/user");
const db = require("../db");




function requireGuest(req, res, next) {
  if (req.session.userId) {
    return res.redirect("/dashboard");
  }
  next();
}


// Home page
router.get("/",requireGuest, (req, res) => {
  res.render("home", { req });
});


// Registration page
router.get("/register",requireGuest, (req, res) => {
  res.render("register", { req });
});


// Handle registration
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  User.create(username, password, (err) => {
    if (err) {
      // Check if it's a duplicate entry error (MySQL error code 1062)
      if (err.code === "ER_DUP_ENTRY") {
        return res.render("register", {
          req,
          error: "Username already exists. Please choose another username.",
        });
      }
      // Handle other errors
      console.error(err);
      return res.render("register", {
        req,
        error: "An error occurred during registration.",
      });
    }
    res.redirect("/login");
  });
});

// Login page
router.get("/login", (req, res) => {
  res.render("login", { req });
});

// Handle login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  User.authenticate(username, password, (err, user) => {
    if (err) {
      return res.render("login", {
        req,
        error: "An error occurred during login.",
      });
    }
    if (user) {
      req.session.userId = user.id;
      res.redirect("/dashboard"); // Changed from /topics to /dashboard
    } else {
      res.render("login", {
        req,
        error: "Invalid username or password.",
      });
    }
  });
});

// Add new dashboard route
router.get("/dashboard", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const userId = req.session.userId;

  // Get user info and progress data
  db.query(
    "SELECT username FROM users WHERE id = ?",
    [userId],
    (err, userResults) => {
      if (err) throw err;

      // Get exercise completion stats
      db.query(
        `
      SELECT 
        COUNT(DISTINCT p.exercise_id) as completed_exercises,
        (SELECT COUNT(*) FROM exercises) as total_exercises
      FROM progress p
      WHERE p.user_id = ?
    `,
        [userId],
        (err, statsResults) => {
          if (err) throw err;

          const completedExercises = statsResults[0].completed_exercises;
          const totalExercises = statsResults[0].total_exercises;
          const progressPercentage =
            Math.round((completedExercises / totalExercises) * 100) || 0;

          // Get topics with completion rates
          db.query(
            `
        SELECT t.*, 
          IFNULL(ROUND(COUNT(DISTINCT p.exercise_id) * 100.0 / 
          (SELECT COUNT(*) FROM exercises WHERE topic_id = t.id), 1), 0) as completion_rate
        FROM topics t
        LEFT JOIN exercises e ON e.topic_id = t.id
        LEFT JOIN progress p ON p.exercise_id = e.id AND p.user_id = ?
        GROUP BY t.id
        ORDER BY t.name ASC
      `,
            [userId],
            (err, allTopics) => {
              if (err) throw err;

              // Get recommended topics (topics with low completion rate)
              const recommendedTopics = allTopics
                .filter((topic) => topic.completion_rate < 100)
                .slice(0, 3);

              // Get recent activity
              db.query(
                `
  SELECT DISTINCT t.*, MAX(p.completed_at) as last_accessed
  FROM topics t
  JOIN exercises e ON e.topic_id = t.id
  JOIN progress p ON p.exercise_id = e.id
  WHERE p.user_id = ?
  GROUP BY t.id
  ORDER BY last_accessed DESC
  LIMIT 3
  `,
                [userId],
                (err, recentTopics) => {
                  if (err) throw err;
                  res.render("dashboard", {
                    req,
                    user: userResults[0],
                    completedExercises,
                    totalExercises,
                    progressPercentage,
                    recommendedTopics,
                    recentTopics,
                    topics: allTopics,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});


// Profile page
router.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  
  db.query(
    "SELECT username FROM users WHERE id = ?", 
    [req.session.userId],
    (err, results) => {
      if (err) throw err;
      res.render("profile", { 
        req,
        user: results[0]
      });
    }
  );
});


module.exports = router;
