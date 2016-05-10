
var express = require('express');
var router = express.Router();
var r = require('rhub-node');
var JenkinsLogStream = require('jenkins-log-stream');
var get_user = require('../lib/get-user');

var JENKINS_URL = process.env.JENKINS_URL;

var re_status =
    '(' +
    '(' + r.valid_package_name + ')' +
    '_' +
    '(' + r.valid_package_version + ')' +
    '[.]tar[.]gz' + '-' +
    '([a-zA-Z0-9]+)' +
    ')$';

// This is the main page. The actual log will be in an IFrame

router.get(new RegExp('^/' + re_status), function(req, res) {
    var name = req.params[0];
    var pkg = req.params[1];
    var version = req.params[2];
    var hash = req.params[3];

    var iframeUrl = req.originalUrl.replace('/status', '/status/log');

    res.render(
	'status',
	{ 'buildId': name,
	  'package': pkg + '_' + version + '.tar.gz',
	  'pkg': pkg,
	  'version': version,
	  'filename': hash,
	  'user': get_user(req),
	  'logUrl': iframeUrl
	}
    );
});

// This is the IFrame embedded into the main page

router.get(new RegExp('^/log/' + re_status), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': JENKINS_URL,
	'job': name
    });

    res.header("Content-Type", "text/plain");

    log.pipe(res);
});

module.exports = router;
