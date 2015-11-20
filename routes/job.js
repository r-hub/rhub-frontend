var express = require('express');
var router = express.Router();
var multer = require('multer');

var uploader = multer({
  dest: __dirname + '/../uploads/'
})

router.post(
    '/',
    uploader.single('package'),
    function(req, res, next) {
	res.end("OK");
    }
)

module.exports = router;
