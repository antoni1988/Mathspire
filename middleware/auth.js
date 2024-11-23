const User = require("../models/User");

const authMiddleware = {
  requireLogin: (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (!req.session.userId || !req.user) {
      return res.redirect("/login");
    }
    next();
  },

  loadUser: async (req, res, next) => {
    if (req.session && req.session.userId) {
      req.user = await User.findById(req.session.userId);
      if (!req.user) {
        req.session.destroy();
        return res.redirect("/login");
      }
    }
    next();
  },

  requireGuest: (req, res, next) => {
    if (req.session.userId) {
      return res.redirect("/dashboard");
    }
    next();
  },
};

module.exports = authMiddleware;
