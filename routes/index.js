var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { 'advanced': false });
});

router.get('/advanced', function(req, res, next) {
    fs.readFile(
	'./public/data/platforms.json',
	'utf8',
	function(err, json) {
	    if (err) { console.log(err); throw(err); }
	    var platforms = JSON.parse(json);
	    res.render('index', { 'advanced': true, platforms: platforms });
	}
    );
});

module.exports = router;
