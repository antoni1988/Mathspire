const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { requireGuest } = require("../middleware/auth");
const db = require("../db");

router.get("/", requireGuest, (req, res) => {
  res.render("home", { req });
});

router.get("/register", requireGuest, (req, res) => {
  res.render("register", { req });
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    await User.create(username, email, password);
    res.redirect("/login");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.render("register", {
        req,
        error: "Username or email already exists.",
      });
    }
    res.render("register", {
      req,
      error: "Registration error.",
    });
  }
});

router.get("/login", requireGuest, (req, res) => {
  res.render("login", { req });
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.authenticate(username, password);

    if (user) {
      req.session.userId = user.id;
      res.redirect("/dashboard");
    } else {
      res.render("login", {
        req,
        error: "Invalid credentials.",
      });
    }
  } catch (err) {
    res.render("login", {
      req,
      error: "Login error.",
    });
  }
});

router.post("/reset-progress", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const user = await User.findById(req.session.userId);
    await user.resetProgress();
    res.redirect("/profile?reset=success");
  } catch (err) {
    console.error("Error resetting progress:", err);
    res.redirect("/profile?reset=error");
  }
});

router.get("/dashboard", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const user = await User.findById(req.session.userId);
    const dashboardData = await user.getDashboardData();

    res.render("dashboard", {
      req,
      user,
      ...dashboardData,
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

router.get("/profile", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const user = await User.findById(req.session.userId);
    const profileData = await user.getProfile();
    res.render("profile", { req, user: profileData });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.status(500).send("Error loading profile");
  }
});

module.exports = router;
