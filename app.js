var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var gzipStatic = require('connect-gzip-static');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var uuid = require('uuid');

var routes = require('./routes/index');
var job = require('./routes/job');
var login = require('./routes/login');
var dokkucheck = require('./routes/check');
var status = require('./routes/status');
var api = require('./routes/api');
var build = require('./routes/build');
var ci = require('./routes/ci');

require('dotenv').config();

require('dotenv').config();

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
var RHUB_BUILDER_URL = process.env.RHUB_BUILDER_URL ||
    'http://127.0.0.1:3000';
var REDIS_URL = process.env.REDIS_URL ||
    'redis://127.0.0.1:6379/0';

passport.use(
    new GitHubStrategy(
	{
	    clientID: GITHUB_CLIENT_ID,
	    clientSecret: GITHUB_CLIENT_SECRET,
	    callbackURL: RHUB_BUILDER_URL + '/login/github/callback'
	},
	function(accessToken, refreshToken, profile, cb) {
	    return cb(null, 'github:' + JSON.stringify(profile.emails));
	}
    )
);

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('hjs', require('hogan-express'));
app.set('view engine', 'hjs');
app.set('partials', {
    'layout': 'layout',
    'header': 'header',
    'navbar': 'navbar',
    'ie7notice': 'ie7notice',
    'footer': 'footer',
    'simple': 'simple',
    'adv': 'adv',
    'joblist': 'joblist'
})

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '100mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(gzipStatic(path.join(__dirname, 'public')));

app.use(session({
    secret: 'r-hub magic going on',
    resave: true,
    saveUninitialized: true,
    genid: function(req) { return uuid.v4(); },
    name: "r-hub frontend",
    cookie: {
	maxAge: 36000000,
	httpOnly: false
    },
    store: new RedisStore({
	url: REDIS_URL
    })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/job', job);

app.use('/', login);
app.use('/status', status);

// The JSON API
app.use('/api', api);

app.use('/build', build);

app.use('/file', express.static('uploads'));

app.use('/check', dokkucheck);

app.use('/ci', ci);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
