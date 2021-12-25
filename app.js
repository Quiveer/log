const express = require('express');
const app = express();
var path = require('path');
const PORT = process.env.PORT || 8000;
var bodyParser = require('body-parser');
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
const winston = require('winston');

// Logger configuration
const logConfiguration = {
  "transports":[
      new winston.transports.File({
          filename:"./views/bakery.log"
      })
      ]
};
// create logger
const logger = winston.createLogger(logConfiguration);

require("cookie-parser");


//Express Session
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

app.use(express.static('public'));
app.use(express.static(__dirname + "./public/"));
app.set('trust proxy', true);
app.set('views', __dirname + '/views');
app.set('view engine','ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use("/", require("./routes/index"));


app.listen(PORT,logger.info('Server started on port 8000'), console.log('Server started on port 8000'));