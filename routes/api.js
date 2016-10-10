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
const prettyMs = require('pretty-ms');

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
	    'submitted': Date(),
	    'platform': platform.name,
	    'ostype': platform["os-type"],
	    'rversion': platform.rversion,
	    'image': platform["docker-image"],
	    'platforminfo': platform,
	    'checkArgs': data.check_args || "",
	    'env': data.env || { }
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

router.get(new RegExp('^/status/' + re_status), function(req, res) {
    var name = req.params[0];

    var jenkins_url = process.env.JENKINS_URL ||
	'http://jenkins.rhub.me';
    var jenkins = require('jenkins');
    var conn = jenkins(jenkins_url);

    var info = {
	'status': 'preparing',
	'submitted': 'moments ago',
	'duration': '...'
    };

    conn.build.get(name, 1, function(err, data) {
	res.set('Content-Type', 'application/json; charset=utf-8');
	if (err) {
	    res.status(404)
		.end(JSON.stringify({
		    "result": "error",
		    "message": "Job not found"
		}));

	} else {
	    info.duration = prettyMs(data.duration, { verbose: true });
	    info.submitted = new Date(data.timestamp).toISOString();
	    if (data.building) {
		info.status = 'in progress'
	    } else if (data.result == 'SUCCESS') {
		info.status = 'success'
	    } else {
		info.status = 'error'
	    }
	}
	res.end(JSON.stringify(info));
    });
});

module.exports = router;
