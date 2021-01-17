require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// var user = require('./models/user');
// var tweets = require('./models/tweets');

var app = express();
const cors = require("cors")
const session = require("express-session")
var passport = require("passport")
const TwitterStrategy = require("passport-twitter").Strategy

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors(
  {
    origin: "https://helpdesktwitterharsh.netlify.app",
    credentials: true
  }
))


app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 100*100*100,
      path: "/",
      httpOnly: true
    },
    rolling: true
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
    //console.log(profile._json)
    const { id, screen_name, profile_image_url, name } = profile._json
    return cb(null, { token, tokenSecret, id, screen_name, profile_image_url, name })
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  //console.log(user)
  done(null, user);
});

app.use(passport.initialize())
app.use(passport.session())

app.get('/login',
  passport.authenticate('twitter'));


app.get("/login/callback", passport.authenticate('twitter'), async (req, res) => {

    const { token, tokenSecret, id, screen_name, profile_image_url, name } = req.session.passport.user
    //console.log(id)
//     let T = getT(token, tokenSecret)
  
//     var stream2 = T.stream("statuses/filter", { track: screen_name, follow: [id] })
  
//     stream2.on('tweet', function (data) {
  
//       if (data.user.screen_name !== screen_name) {
//         //console.log("tweet", data.user.screen_name, screen_name)
//         io.emit("mention", data)
//       }
//       else {
//         //console.log("follow")
//         io.emit("follow", data)
//       }
  
//     })
  
    res.redirect(`http://localhost:3000/logincomplete?&${token}&${tokenSecret}&${screen_name}&${profile_image_url}&${name}`)
  
  })
  


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});





// var Twit = require('twit')

// function getT(token, tokenSecret) {
//   return new Twit({
//     consumer_key: process.env.consumerKey,
//     consumer_secret: process.env.consumerSecret,
//     access_token: token,
//     access_token_secret: tokenSecret,

//   })

// }


// app.get("/mentions", async (req, res) => {
//   //console.log("mentions")
//   try {

//     const { token, tokenSecret, id, screen_name } = req.session.passport.user
//     let T = getT(token, tokenSecret)
//     //console.log(screen_name)
//     const mentions = await T.get(`statuses/mentions_timeline`)
//     const userStatuses = await T.get(`statuses/user_timeline`)
//     //console.log(mentions.data, "mentions")
//     //console.log("status", userStatuses.data)
//     res.send([...mentions.data, ...userStatuses.data])
//   }
//   catch (err) {
//     res.sendStatus(400)
//   }
// })

// app.post("/reply", async (req, res) => {
//   // //console.log(reply)
//   const { token, tokenSecret, id, screen_name } = req.session.passport.user
//   const { status, in_reply_to_status_id } = req.body
//   let T = getT(token, tokenSecret)

//   const reply = await T.post("/statuses/update", { status, in_reply_to_status_id, auto_populate_reply_metadata: true })

//   res.send("done")

// })



// app.get("/replies/:id", async (req, res) => {
//   //console.log("lookup")
//   const { token, tokenSecret, id, screen_name } = req.session.passport.user
//   let T = getT(token, tokenSecret)
//   const tweetId = req.params.id
//   const lookup = await T.get(`/search/tweets.json?q=@${id}`)
//   console.table(lookup.data)
//   //console.log(lookup.data)
//   // res.send(lookup.data)

// })

// app.get("/logout", (req, res) => {
//   //console.log("logout")
//   req.session.passport = null
//   res.send("logout")
// })



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
