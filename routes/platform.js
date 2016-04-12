var express = require('express');
var router = express.Router();

router.get('/list', function(req, res) {
    res.set('Content-Type', 'application/json')
	.sendfile('./public/data/platforms.json');
});

module.exports = router;
