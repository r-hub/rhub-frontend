var express = require('express');
var router = express.Router();
var redis = require('redis');
var urls = require('../lib/urls');
var client = null;
var uuid = require('uuid');
var mail_token = require('../lib/mail-token');
var get_image = require('../lib/get-image');
var queue_job = require('../lib/queue-job');
var fs = require('fs');
var re_status = require('../lib/re-status');
var got = require('got');
var url = require('url');
var jenkins = require('jenkins')( {
  baseUrl: urls.jenkins, crumbIssuer: true });
var isArray = require('is-array');
var async = require('async');
var db = require('nano')(urls.logdb);

router.get('/platform/list', function(req, res) {
    res.set('Content-Type', 'application/json; charset=utf-8')
	.sendfile('./public/data/platforms.json');
});

router.post('/check/validate_email', function(req, res) {
    var data = req.body;

    // If there is no email
    if (! data.email ) {
	return res.set('Content-Type', 'application/json; charset=utf-8')
	    .status(400)
	    .end(JSON.stringify({
		"result": "error",
		"message": "Invalid data, no 'email' field"
	    }));
    }

    var token = uuid.v4().replace(/-/g, "");

    // Add to the DB, if successful, then try to send an email
    if (client ===  null) {
        client = redis.createClient(urls.validemail_url);
    }
    client.set(data.email + '-pending', token, function(err) {
	if (err) { return internal_error(res); }

	mail_token(data.email, token, function(err) {
	    if (err) { return internal_error(res); }
	    return res.set('Content-Type', 'application/json; charset=utf-8')
		.status(200)
		.end(JSON.stringify({
		    "result": "success",
		    "message": "Email sent."
		}));
	});
    })
});

router.post('/check/submit', function(req, res) {
    var data = req.body;

    // Check all fields
    if (! data.email || ! data.token || ! data.file || ! data.package ||
	! data.version) {
	return res.set('Content-Type', 'application/json; charset=utf-8')
	    .status(400)
	    .end(JSON.stringify({
		"result": "error",
		"message":
		"Invalid data, need 'email', 'token', 'file', 'package', 'version'"
	    }));
    }

    if (client ===  null) {
        client = redis.createClient(urls.validemail_url);
    }
    client.get(data.email, function(err, token) {
	if (err) { return internal_error(res, "Email not validated"); }
	if (data.token == token) {
	    return valid_submission(req, res, data);
	}
	client.get(data.email + '-pending', function(err, token2) {
	    if (data.token == token2) {
		client.set(data.email, token2, function(err) {
		    if (err) {
			return internal_error(res, "Email not validated");
		    }
		    return valid_submission(req, res, data);
		});
	    } else {
		return res.set('Content-Type', 'application/json; charset=utf-8')
		    .status(401)
		    .end(JSON.stringify({
			"result": "error",
			"message": "Email address not validated"
		    }));
	    }
	});
    });
});

function internal_error(res, message) {
    var msg = message || "Cannot send email";
    return res.set('Content-Type', 'application/json; charset=utf-8')
	.status(500)
	.end(JSON.stringify({
	    "result": "error",
	    "message": msg
	}));
}

function valid_submission(req, res, data) {

    var filename = uuid.v4().replace(/-/g, "");
    var full_filename = __dirname + '/../uploads/' + filename;

    fs.writeFile(full_filename, data.file, 'base64', function(err) {
	if (err) { return internal_error(res, "Cannot upload file"); }

	var platform = data.platform;
	if (! isArray(platform)) { data.platform = [ platform ]; }
	async.map(
	    data.platform,
	    function(p, cb) {
		var hash = uuid.v4().replace(/-/g, "");
		valid_submission1(hash, p, data, req, filename, cb);
	    },
	    function(err, results) {
		if (err) { return internal_error(res, err); }
		if (! isArray(platform)) {
		    results = results[0];
		} else {
		    var d = { };
		    for (i in results) { d[platform[i]] = results[i]; }
		    results = d;
		}
		res.set('Content-Type', 'application/json; charset=utf-8')
		    .status(201)
		    .end(JSON.stringify(results));
	    }
	);
    });
}

function valid_submission1(hash, platform, data_orig, req, filename, callback) {

    var data = data_orig;
    data.platform = platform;

    var originalname = data.package + '_' + data.version + '.tar.gz';
    var id = originalname + '-' + hash;
    var baseurl = process.env.RHUB_BUILDER_URL ||
	req.protocol + '://' + req.get('host');
    var url = baseurl + '/file/' + filename;
    var logUrl = '/status/' + id;
    var rawLogUrl = '/status/original/' + id;
    var fullLogUrl = req.protocol + '://' + req.get('host') + logUrl;
    var fullRawLogUrl = req.protocol + '://' + req.get('host') + rawLogUrl;

    get_image(data.platform, function(err, platform) {
	if (err) { return callback("Invalid platform"); }

	var job = {
	    'buildId': id,
	    'package': originalname,
	    'filename': filename,
	    'url': url,
	    'size': null,
	    'email': data.email,
	    'pkg': data.package,
	    'version': data.version,
	    'logUrl': logUrl,
	    'submitted': new Date().toISOString(),
	    'platform': platform.name,
	    'ostype': platform["os-type"],
	    'rversion': platform.rversion,
	    'image': platform["docker-image"],
	    'platforminfo': platform,
	    'checkArgs': data.check_args || "",
	    'envVars': data.env || { },
	    'scripts': data.scripts || null,
	    'builder': baseurl,
	    'options': data.options || { }
	};

	queue_job(job);

	var result = {
	    "result": "submitted",
	    "email": data.email,
	    "id": job.buildId,
	    "status-url": fullLogUrl,
	    "log-url": fullRawLogUrl
	};

	callback(null, result);
    });
}

// This is for compatibility
router.get(new RegExp('^/status/' + re_status + '$'), function(req, res) {
    var name = req.params[0];

    var fullurl = urls.logdb + '/' + name;
    var _url = url.parse(fullurl);
    var dburl = _url.protocol + '//' + _url.host + _url.path;

    res.set('Content-Type', 'application/json; charset=utf-8');

    got.get(
        dburl,
        { auth: _url.auth },
        function(err, response) {
            if (err) {
                var msg = { 'status': 'error',
                            'message': 'Build not found' };
                return res.set(404)
                    .end(JSON.stringify(msg));
            }

            res.end(response);
        }
    );
});

router.post('/status', function(req, res) {

    var data = req.body;

    res.set('Content-Type', 'application/json; charset=utf-8');

    if (! data.id || !isArray(data.id)) {
	return res.status(400)
	    .end(JSON.stringify({
		"result": "error",
		"message": "Invalid data, need 'id', a list of ids" }));
    }

    var qs = { keys: data.id };

    db.fetch(qs, function(err, data) {
	if (err) {
	    var msg = { 'status': 'error',
			'message': 'Build not found: ' + err };
	    return res.set(404)
		.end(JSON.stringify(msg));
	}

	var docs = data.rows.map(function(x) { return x.doc; });
	res.end(JSON.stringify(docs));
    });
});

router.post('/list', function(req, res) {

    var data = req.body;

    if (! data.email || ! data.token) {
	return res.set('Content-Type', 'application/json; charset=utf-8')
	    .status(400)
	    .end(JSON.stringify({
		"result": "error",
		"message": "Invalid data, need 'email' and 'token'" }));
    }

    if (client ===  null) {
        client = redis.createClient(urls.validemail_url);
    }
    client.get(data.email, function(err, token) {
	if (err) { return internal_error(res, "Email not validated"); }
	if (data.token != token) {
	    return res.set('Content-Type', 'application/json; charset=utf-8')
		.status(401)
		.end(JSON.stringify({
		    "result": "error",
		    "message": "Email address not validated"
		}));
	}

	if (data.package) {
	    list_email_package(req, res, data.email, data.package);
	} else {
	    list_email(req, res, data.email);
	}
    });
});

function list_email(req, res, email) {

    var fullurl = urls.logdb + '/_design/app/_rewrite/-/email/' +
	encodeURIComponent(email) + '?limit=20';
    var _url = url.parse(fullurl);
    var dburl = _url.protocol + '//' + _url.host + _url.path;

    got.get(dburl, { auth: _url.auth }, function(err, response) {
	if (err) { return internal_error(res, "Email not validated"); }

	var list = JSON.parse(response).rows.map(
	    function(x) { return x.value; }
	);
	res.set('Content-Type', 'application/json; charset=utf-8')
	    .end(JSON.stringify(list));
    });
}

function list_email_package(req, res, email, pkg) {

    var fullurl = urls.logdb + '/_design/app/_rewrite/-/package/' +
	encodeURIComponent(email) + '/' + encodeURIComponent(pkg) +
	'?limit=20';
    var _url = url.parse(fullurl);
    var dburl = _url.protocol + '//' + _url.host + _url.path;

    got.get(dburl, { auth: _url.auth }, function(err, response) {
	if (err) { return internal_error(res, "Cannot get statuses"); }

	var list = JSON.parse(response).rows.map(
	    function(x) { return x.value; }
	);
	res.set('Content-Type', 'application/json; charset=utf-8')
	    .end(JSON.stringify(list));
    });
}

router.get(
    new RegExp('^/livelog/text/' + re_status + '$'),
    function(req, res) {
	var name = req.params[0];
	var start = req.query.start || 0;

	var options = { 'name': name,
			'number': 1,
			'start': start,
			'meta': true };

	jenkins.build.log(options, function(err, data) {
	    if (err) { console.log(err); return internal_error(res, "Cannot get logs"); }

	    if (data.more) {
		var rurl = 'https://' + req.get('Host') +
		    req.baseUrl + req.url;
		var moreUrl = url.parse(rurl, true);
		moreUrl.query = moreUrl.query || { };
		moreUrl.query.start = data.size;
		moreUrl.path = moreUrl.href = moreUrl.search = null;
		data.moreUrl = url.format(moreUrl);
	    }

	    if (data.text) {
		data.text = data.text.replace(/\r\n/g, "\n");
		data.text = data.text.replace(/\n$/, "");
		data.text = data.text.split("\n");
	    } else {
		data.text = [];
	    }

	    res.set('Content-Type', 'application/json; charset=utf-8')
		.end(JSON.stringify(data));
	});
    }
);

module.exports = router;
