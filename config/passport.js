const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");

//load User Model
const admins = require("../models/admin");

module.exports = passport => {
  passport.use(
    new LocalStrategy(
      {usernameField: "username", passwordField: "password"},
      (username, password, done) => {
        //Match User
        admins.findOne({username:username})
          .then(user => {
            if (!user) {
              return done(null, false, {
                message: "That user is not registered."
              });
            }

            //Match Password
            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err;

              if (isMatch) {
                return done(null, user);
              } else {
                return done(null, false, {message: "Password incorrect"});
              }
            });
          })
          .catch(err => console.log(err));
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    admins.findById(id, (err, user) => {
      done(err, user);
    });
  });
};
