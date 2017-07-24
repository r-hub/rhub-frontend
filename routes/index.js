var express = require('express');
var router = express.Router();
var get_user = require('../lib/get-user');
var fs = require('fs');
var flatten = require('array-flatten');

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

	    platform_groups = get_platform_groups(platforms);
	    
	    res.render('index', {
		'advanced': true,
		platforms: platforms,
		groups: platform_groups,
		user: get_user(req)
	    });
	}
    );
});

router.get('/terms.html', function(req, res) {
    res.render('terms', { 'user': get_user(req) });
});

function unique(value, index, self) { 
    return self.indexOf(value) === index;
}

function get_platform_groups(platforms) {
    var groups = platforms
	.map(function(x) { return x.categories; });
    // This just happens to be OK
    var groupnames = flatten(groups).sort().reverse();

    return groupnames.filter(unique)
	.map(function(g) {
	    return { "name": g,
		     "value": platforms.filter(function(p) {
			 return p.categories.indexOf(g) != -1
		     })
		   };
	});
}

module.exports = router;
