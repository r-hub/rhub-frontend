var express = require('express');
var router = express.Router();
var multer = require('multer');
var rhub = require('rhub-node');
var create_job = require('../lib/create-job');
var queue_job = require('../lib/queue-job');
var get_user = require('../lib/get-user');
var auth_ok = require('../lib/auth-ok');
var uploader = multer({
    dest: __dirname + '/../uploads/'
})

// POST request uploads the package
//
// If the session is authenticated, and the email
// addresses match, we queue the job.
//
// Otherwise we store the job in the session and
// go to authenticate. The authentication
// will call back to /job again, but with a GET request.
// The job data is still in the session. If the emails
// match we queue the job, otherwise an error page is
// returned.

router.post(
    '/',
    uploader.single('package'),
    function(req, res, next) {
	create_job(req, function(err, job) {
	    if (err) {
		res.render(
		    "badpackage",
		    { 'error': err, user: get_user(req) }
		);
	    } else {
		if (auth_ok(req, job)) {
		    queue_job(job);
		    job.user = get_user(req);
		    res.redirect("/status/" + job.buildId);
		} else {
		    req.session.job = job;
		    req.session.job.user = get_user(req)
		    res.render('verify', req.session.job);
		}
	    }
	})
    }
);

router.get(
    '/',
    function(req, res, next) {
	if (auth_ok(req, req.session.job)) {
	    queue_job(req.session.job);
	    req.session.job.user = get_user(req);
	    res.redirect("/status/" + req.session.job.buildId);
	} else {
	    res.render(
		'badpackage',
		{ 'error': 'cannot verify email address',
		  'package': req.session.job['package'],
		  'job': req.session.job,
		  'user': get_user(req)
		}
	    );
	}
    }
);

module.exports = router;
