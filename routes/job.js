var express = require('express');
var router = express.Router();
var multer = require('multer');
var rhub = require('rhub-node');
var queue_job = require('../lib/queue-job');
var create_job = require('../lib/create-job');
var create_cran_job = require('../lib/create-cran-job');

var uploader = multer({
  dest: __dirname + '/../uploads/'
})

router.post(
    '/',
    uploader.single('package'),
    function(req, res, next) {
	create_job(req, function(err, job) {
	    if (err) {
		res.render("badpackage", { 'error': err });
	    } else {
		queue_job(job);
		res.render("ok", job);
	    }
	})
    }
)

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
