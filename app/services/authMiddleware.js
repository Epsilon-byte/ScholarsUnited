function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // ✅ User is authenticated
  }

  // ❌ User not logged in — store a friendly message
  req.session.messages = {
    error: ["Please log in to access this page."]
  };

  return res.redirect("/login");
}

module.exports = ensureAuthenticated;
