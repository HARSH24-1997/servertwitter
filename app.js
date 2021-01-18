require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Twit = require('twit')
var socketio = require('socket.io')
var http = require("http");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const server = require('http').createServer(app);
const io =socketio(server);

var app = express();
const cors = require("cors")
const session = require("express-session")
var passport = require("passport")
const TwitterStrategy = require("passport-twitter").Strategy


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors(
  {
    origin: "http://localhost:3000",
    credentials: true
  }
))

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use('/', indexRouter);
app.use('/users', usersRouter);

passport.use(new TwitterStrategy({
  consumerKey: process.env.consumerKey,
  consumerSecret: process.env.consumerSecret,
  callbackURL: "https://twitterserverharsh.herokuapp.com/login/callback"
},
  function (token, tokenSecret, profile, cb) {
    const { id, screen_name, profile_image_url, name } = profile._json
    return cb(null, { token, tokenSecret, id, screen_name, profile_image_url, name })
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

function twitToken(token, tokenSecret) {
  return new Twit({
    consumer_key: process.env.consumerKey,
    consumer_secret: process.env.consumerSecret,
    access_token: token,
    access_token_secret: tokenSecret,
  })
}


app.use(passport.initialize())
app.use(passport.session())

app.get('/login', passport.authenticate('twitter'));

app.get("/login/callback", passport.authenticate('twitter'), async (req, res) => {

  const { token, tokenSecret, id, screen_name, profile_image_url, name } = req.session.passport.user
  let Temp = twitToken(token, tokenSecret)
  var stream2 = Temp.stream("statuses/filter", { track: screen_name, follow: [id] })
  stream2.on('tweet', function (data) {
    if (data.user.screen_name !== screen_name) {
      io.emit("mention", data)
    }
    else {
      io.emit("follow", data)
    }
  })
  res.redirect(`https://helpdesktwitterharsh.netlify.app/logincomplete?&${token}&${tokenSecret}&${screen_name}&${profile_image_url}&${name}`)
})

app.get("/logout", (req, res) => {
  req.session.passport = null
  res.send("logout")
})


app.get("/mentions", async (req, res) => {
  try {
    const { token, tokenSecret, id, screen_name } = req.session.passport.user
    let Temp = twitToken(token, tokenSecret)
    const mentions = await Temp.get(`statuses/mentions_timeline`)
    const userStatuses = await Temp.get(`statuses/user_timeline`)
    console.log(mentions.data)
    console.log(userStatuses.data)
    var arr =[];
    res.send(arr.concat(userStatuses.data,mentions.data))
  }
  catch (err) {
    res.sendStatus(400)
  }
})

app.post("/reply", async (req, res) => {
  const { token, tokenSecret, id, screen_name } = req.session.passport.user
  const { status, in_reply_to_status_id } = req.body
  let Temp = twitToken(token, tokenSecret)
  const reply = await Temp.post("/statuses/update", { status, in_reply_to_status_id, auto_populate_reply_metadata: true })
  res.send("done")
})


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
