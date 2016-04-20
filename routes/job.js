var express = require('express');
var router = express.Router();
var multer = require('multer');
var rhub = require('rhub-node');
var create_job = require('../lib/create-job');
var create_cran_job = require('../lib/create-cran-job');
var queue_job = require('../lib/queue-job');
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
		res.render("badpackage", { 'error': err });
	    } else {
		if (auth_ok(req, job)) {
		    queue_job(job);
		    res.render('ok', req.session.job);
		} else {
	            req.session.job = job;
		    res.render('verify', req.session.job);
		}
	    }
	})
    },
  function(req, res, next) {
    }
);

router.get(
    '/',
    function(req, res, next) {
	if (auth_ok(req, req.session.job)) {
	    queue_job(req.session.job);
	    res.render('ok', req.session.job);
	} else {
	    res.render(
		'badpackage',
		{ 'error': 'cannot verify email address',
		  'package': req.session.job['package'],
		  'job': req.session.job }
	    );
	}
    }
);

router.post(
    new RegExp('^/cran/(' + rhub.valid_package_name + ')$'),
    function(req, res) {
	var package = req.params[0];
	create_cran_job(package, req, function(err, job) {
	    if (err) {
		res.render("badpackage", { 'error': err });
	    } else {
		queue_job(job);
		res.render("ok", job);
	    }
	})
    }
)

module.exports = router;
