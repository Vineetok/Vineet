const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
  res.render("./users/signup.ejs");
};

module.exports.Signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);

    //it automatically logins the user after sign up.
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Wanderlust!");
      let redirectUrl = res.locals.redirectUrl || "/listings";
      res.redirect(redirectUrl);
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginform = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welcome  back to wanderlust!");
  let redirectUrl = req.session.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }

    req.flash("success", "you are logged out!");
    res.redirect("/listings");
  });
};
