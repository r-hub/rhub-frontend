
var express = require('express');
var router = express.Router();
var passport = require('passport');
var mail_verification_code = require('../lib/mail-verification-code');
var get_user = require('../lib/get-user');

var queue_job = require('../lib/queue-job');

router.get('/login', function(req, res) {
    req.session.job.user = get_user(req);
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

router.get(
    '/login/sendcode',
    function(req, res) {
	if (!req.session || !req.session.job) {
	    return res.status(404)
		.send("No package upload?");
	}
	mail_verification_code(req, function(err, done) {
	    if (err) {
		res.status(404)
		    .send("Cannot send email");
	    } else {
		res.send("OK");
	    }
	})
    }
);

router.post(
    '/login/submitcode',
    function(req, res) {
	if (!req.session || !req.session.job) { res.redirect('/'); }
	var submitted = req.body.code;
	if (submitted == req.session.verification) {
	    queue_job(req.session.job);
	    if (!req.session.passport) { req.session.passport = { }; }
	    req.session.passport.user = 'email:' + req.session.job.email;
	    req.session.job.user = get_user(req);
	    res.render('ok', req.session.job);
	    delete req.session.job;
	} else {
	    res.render('verify', req.session.job);
	}
    }
);

module.exports = router;
