
var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/login', function(req, res) {
    res.render("verify", req.session.job);
});

router.get('/login/github', passport.authenticate('github'));

router.get(
    '/login/github/callback',
    function(req, res, next) {
	passport.authenticate(
	    'github',
	    { successReturnToOrRedirect: '/job', failureRedirect: '/job' }
	)(req, res, next);
    }
);

router.get(
    '/logout',
    function(req, res) {
	req.logout();
	res.redirect('/');
    }
);

module.exports = router;
