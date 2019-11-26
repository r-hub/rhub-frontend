var express = require('express');
var router = express.Router();
var redis = require('redis');
var urls = require('../lib/urls');
var client = redis.createClient(urls.validemail_url);
var uuid = require('uuid');
var mail_token = require('../lib/mail-token');
var get_image = require('../lib/get-image');
var queue_job = require('../lib/queue-job');
var fs = require('fs');
var re_status = require('../lib/re-status');
var got = require('got');
var url = require('url');
var jenkins = require('jenkins')( { baseUrl: urls.jenkins });
var isArray = require('is-array');
var async = require('async');
var db = require('nano')(urls.logdb);
var check_token = require('../lib/check-token');

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
	    .send(JSON.stringify({
		"result": "error",
		"message": "Invalid data, no 'email' field"
	    }));
    }

    var token = uuid.v4().replace(/-/g, "");

    // Add to the DB, if successful, then try to send an email
    client.set(data.email + '-pending', token, function(err) {
	if (err) { return internal_error(res); }

	mail_token(data.email, token, function(err) {
	    if (err) { return internal_error(res); }
	    return res.set('Content-Type', 'application/json; charset=utf-8')
		.status(200)
		.send(JSON.stringify({
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
	    .send(JSON.stringify({
		"result": "error",
		"message":
		"Invalid data, need 'email', 'token', 'file', 'package', 'version'"
	    }));
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
		    .send(JSON.stringify({
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
	.send(JSON.stringify({
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
	data.submitted = new Date().toISOString();
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
		    .send(JSON.stringify(results));
	    }
	);
    });
}

function get_protocol (req) {
    var proto = req.connection.encrypted ? 'https' : 'http';
    // only do this if you trust the proxy
    proto = req.headers['x-forwarded-proto'] || proto;
    return proto.split(/\s*,\s*/)[0];
}

function valid_submission1(hash, platform, data_orig, req, filename, callback) {

    var data = data_orig;
    data.platform = platform;

    var protocol = get_protocol(req);
    var originalname = data.package + '_' + data.version + '.tar.gz';
    var groupid = originalname + "-" + filename;
    var id = originalname + '-' + hash;
    var url = protocol + '://' + req.get('host') + '/file/' + filename;
    var logUrl = '/status/' + id;
    var rawLogUrl = '/status/original/' + id;
    var fullLogUrl = protocol + '://' + req.get('host') + logUrl;
    var fullRawLogUrl = protocol + '://' + req.get('host') + rawLogUrl;

    get_image(data.platform, function(err, platform) {
	if (err) { return callback("Invalid platform"); }

	var job = {
	    'buildId': id,
	    'package': originalname,
	    'filename': filename,
	    'group': groupid,
	    'url': url,
	    'size': null,
	    'email': data.email,
	    'pkg': data.package,
	    'version': data.version,
	    'logUrl': logUrl,
	    'submitted': data.submitted,
	    'platform': platform.name,
	    'ostype': platform["os-type"],
	    'rversion': platform.rversion,
	    'image': platform["docker-image"],
	    'platforminfo': platform,
	    'checkArgs': data.check_args || "",
	    'envVars': data.env || { },
	    'scripts': data.scripts || null,
	    'builder': 'https://' + req.get('host'),
	    'options': data.options || { },
	    'ui': 'api'
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

// This is for compatibility, the POST request handles a list of ids
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
                return res.status(404)
                    .send(JSON.stringify(msg));
            }

	    response.ui = response.ui || 'unknown';
            res.send(response);
        }
    );
});

router.get(
    new RegExp('^/status/group/' + re_status + '$'),
    function(req, res) {
	var name = req.params[0];

	var fullurl = urls.logdb + '/_design/app/_rewrite/-/bygroup/' +
	    encodeURIComponent(name);
	var _url = url.parse(fullurl);
	var dburl = _url.protocol + '//' + _url.host + _url.path;

	got.get(dburl, { auth: _url.auth }, function(err, response) {
	    if (err) { return internal_error(res, "Cannot find group"); }
	    var data = JSON.parse(response).rows;
	    var result = data.map(function(x) { return x.doc; });
	    res.set('Content-Type', 'application/json; charset=utf-8')
		.send(JSON.stringify(result));
	});
    }
);


router.post('/status', function(req, res) {

    var data = req.body;

    res.set('Content-Type', 'application/json; charset=utf-8');

    if (! data.id || !isArray(data.id)) {
	return res.status(400)
	    .send(JSON.stringify({
		"result": "error",
		"message": "Invalid data, need 'id', a list of ids" }));
    }

    var qs = { keys: data.id };

    db.fetch(qs, function(err, data) {
	if (err) {
	    var msg = { 'status': 'error',
			'message': 'Build not found: ' + err };
	    return res.status(404)
		.send(JSON.stringify(msg));
	}

	var errors = [];
	data.rows.map(function(x) { if (x.error) errors.push(x) });
	if (errors.length) {
	    var msg = { 'status': 'error',
			'message': 'not found',
			'details': errors };
	    return res.status(404)
		.send(JSON.stringify(msg));
	}

	var docs = data.rows.map(function(x) {
	    x.doc.ui = x.doc.ui || 'unknown';
	    return x.doc;
	});
	res.send(JSON.stringify(docs));
    });
});

// This is deprecated now, use the GET method

router.post('/list', function(req, res) {

    var data = req.body;

    if (! data.email || ! data.token) {
	return res.set('Content-Type', 'application/json; charset=utf-8')
	    .status(400)
	    .send(JSON.stringify({
		"result": "error",
		"message": "Invalid data, need 'email' and 'token'" }));
    }

    client.get(data.email, function(err, token) {
	if (err) { return internal_error(res, "Email not validated"); }
	if (data.token != token) {
	    return res.set('Content-Type', 'application/json; charset=utf-8')
		.status(401)
		.send(JSON.stringify({
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

router.get('/list/:email', function(req, res) {
    check_token(client, req, res, function(err, email) {
	if (err) { console.log(err); return; }
	var fullurl = urls.logdb + '/_design/app/_rewrite/-/group/email/' +
	    encodeURIComponent(email) + '?limit=20';
	return list_generic(fullurl, res);

    });
});

router.get('/list/:email/:package', function(req, res) {
    check_token(client, req, res, function(err, email) {
	if (err) { console.log(err); return; }
	var fullurl = urls.logdb + '/_design/app/_rewrite/-/group/package/' +
	    encodeURIComponent(email) + '/' + req.params.package + '?limit=20';
	return list_generic(fullurl, res);
    });
});

function list_generic(fullurl, res) {
    var _url = url.parse(fullurl);
    var dburl = _url.protocol + '//' + _url.host + _url.path;

    got.get(dburl, { auth: _url.auth }, function(err, response) {
	if (err) { return internal_error(res, "Email not validated"); }

	var jresponse = JSON.parse(response);
	var groups = jresponse.rows.map(
	    function(x) { return x.value; }
	);
	var ids = [].concat.apply([], groups);

	fullurl = urls.logdb + '/_all_docs?include_docs=true';
	_url = url.parse(fullurl);
	dburl = _url.protocol + '//' + _url.host + _url.path;

	got.post(
	    dburl,
	    { auth: _url.auth, body: JSON.stringify({ keys: ids}) },
	    function(err2, response2) {
		if (err2) { return internal_error(res, "Internal error"); }
		var reply = { };
		var jresponse2 = JSON.parse(response2);
		jresponse2.rows.map(
		    function(x) {
                        if (!x.doc) {
                            return internal_error(res, "Internal error");
                        }
			var g = x.doc.group || x.doc.id;
			x.doc.group = g;
			x.doc.ui = x.doc.ui || 'unknown';
			x.doc.check_output = null;
			x.doc.preperror_log = null;
			if (! reply[g]) { reply[g] = [ ] }
			reply[g].push(x.doc)
			return null;
		    }
		);

		res.set('Content-Type', 'application/json; charset=utf-8')
		    .send(JSON.stringify(reply));
	    });
    });
}

function list_email(req, res, email) {

    var fullurl = urls.logdb + '/_design/app/_rewrite/-/email/' +
	encodeURIComponent(email) + '?limit=20';
    var _url = url.parse(fullurl);
    var dburl = _url.protocol + '//' + _url.host + _url.path;

    got.get(dburl, { auth: _url.auth }, function(err, response) {
	if (err) { return internal_error(res, "Internal error"); }

	var list = JSON.parse(response).rows.map(
	    function(x) { return x.value; }
	);
	res.set('Content-Type', 'application/json; charset=utf-8')
	    .send(JSON.stringify(list));
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
	    .send(JSON.stringify(list));
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
		.send(JSON.stringify(data));
	});
    }
);

module.exports = router;
