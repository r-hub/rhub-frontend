var express = require('express');
var router = express.Router();
var get_user = require('../lib/get-user');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { 'advanced': false, 'user': get_user(req) });
});

router.get('/advanced', function(req, res, next) {
    fs.readFile(
	'./public/data/platforms.json',
	'utf8',
	function(err, json) {
	    if (err) { console.log(err); throw(err); }
	    var platforms = JSON.parse(json);
	    var user = null;
	    res.render('index', {
		'advanced': true,
		platforms: platforms,
		user: get_user(req)
	    });
	}
    );
});

module.exports = router;
