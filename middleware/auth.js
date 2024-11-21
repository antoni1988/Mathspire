const authMiddleware = {
  requireLogin: (req, res, next) => {
    if (!req.session.userId) {
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
