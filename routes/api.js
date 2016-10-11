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

    client.get(data.email, function(err, token) {
	if (err) { return internal_error(res); }
	if (data.token == token) {
	    return valid_submission(req, res, data);
	}
	client.get(data.email + '-pending', function(err, token2) {
	    if (data.token == token2) {
		client.set(data.email, token2, function(err) {
		    if (err) { return internal_error(res); }
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

function internal_error(res) {
    return res.set('Content-Type', 'application/json; charset=utf-8')
	.status(500)
	.end(JSON.stringify({
	    "result": "error",
	    "message": "Cannot send email"
	}));
}

function valid_submission(req, res, data) {

    var filename = uuid.v4().replace(/-/g, "");
    var originalname = data.package + '_' + data.version + '.tar.gz';
    var url = req.protocol + '://' + req.get('host') + '/file/' + filename;
    var logUrl = '/status/' + originalname + '-' + filename;
    var rawLogUrl = '/status/original/' + originalname + '-' + filename;
    var fullLogUrl = req.protocol + '://' + req.get('host') + logUrl;
    var fullRawLogUrl = req.protocol + '://' + req.get('host') + rawLogUrl;

    get_image(data.platform, function(err, platform) {
	if (err) { return internal_error(res, "Invalid platform"); }

	var job = {
	    'buildId': originalname + '-' + filename,
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
	    'env': data.env || { },
	    'builder': 'https://' + req.get('host')
	};

	var full_filename = __dirname + '/../uploads/' + filename;
	fs.writeFile(full_filename, data.file, 'base64', function(err) {
	    if (err) { return internal_error(res); }
	    queue_job(job);
	    res.set('Content-Type', 'application/json; charset=utf-8')
		.status(201)
		.end(JSON.stringify({
		    "result": "submitted",
		    "email": data.email,
		    "id": job.buildId,
		    "status-url": fullLogUrl,
		    "log-url": fullRawLogUrl
		}));
	});
    });
}

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

router.post('/list', function(req, res) {

    var data = req.body;

    if (! data.email || ! data.token) {
	return res.set('Content-Type', 'application/json; charset=utf-8')
	    .status(400)
	    .end(JSON.stringify({
		"result": "error",
		"message": "Invalid data, need 'email' and 'token'" }));
    }

    client.get(data.email, function(err, token) {
	if (err) { return internal_error(res); }
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
	if (err) { return internal_error(res); }

	var list = JSON.parse(response).rows;
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
	if (err) { return internal_error(res); }

	var list = JSON.parse(response).rows;
	res.set('Content-Type', 'application/json; charset=utf-8')
	    .end(JSON.stringify(list));
    });
}

module.exports = router;
