
var express = require('express');
var router = express.Router();
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;

var GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
var GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

passport.use(
    new GitHubStrategy(
	{
	    clientID: GITHUB_CLIENT_ID,
	    clientSecret: GITHUB_CLIENT_SECRET,
	    callbackURL: 'http://127.0.0.1:3000/login/github/callback'
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

router.get('/login', function(req, res) {
    res.render("verify", req.session.job);
});

router.get('/login/github', passport.authenticate('github'));

router.get(
    '/login/github/callback',
    passport.authenticate(
	'github',
	{ successReturnToOrRedirect: '/job', failureRedirect: '/job' }
    )
);

router.get(
    '/logout',
    function(req, res) {
	req.logout();
	res.redirect('/');
    }
);

module.exports = router;
