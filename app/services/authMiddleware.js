function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
      // If the User is authenticated, proceed to the next middleware or route handler
      return next();
    }
  
    // If the User is not authenticated, redirect to the login page
    res.redirect("/login");
  }
  
  module.exports = ensureAuthenticated;