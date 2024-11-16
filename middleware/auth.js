const authMiddleware = {
  requireLogin: (req, res, next) => {
    if (!req.session.userId) {
      if (req.xhr || req.headers.accept?.includes("application/json")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      return res.redirect("/login");
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
