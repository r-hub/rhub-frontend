var express = require('express');
var router = express.Router();
var multer = require('multer');
var queue_job = require('../lib/queue-job');

var uploader = multer({
  dest: __dirname + '/../uploads/'
})

router.post(
    '/',
    uploader.single('package'),
    function(req, res, next) {
	queue_job(req.file, req.body);
	res.end("OK");
    }
)

module.exports = router;
