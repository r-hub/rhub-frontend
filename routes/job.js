var express = require('express');
var router = express.Router();
var multer = require('multer');
var queue_job = require('../lib/queue-job');
var create_job = require('../lib/create-job');

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

module.exports = router;
