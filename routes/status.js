
var express = require('express');
var router = express.Router();
var r = require('rhub-node');
var JenkinsLogStream = require('jenkins-log-stream');
var get_user = require('../lib/get-user');
var byline = require('byline');
var LogFilter = require('../lib/filter-log');
var SimpleLogFilter = require('../lib/filter-log').SimpleLogFilter;
const prettyMs = require('pretty-ms');

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

router.get(new RegExp('^/log/' + re_status), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': JENKINS_URL,
	'job': name
    });
    var log_by_line = byline(log);
    var logFilter = new LogFilter();

    res.header("Content-Type", "text/html")
	.write(
	    "<!doctype html>" +
	    "<html lang=en><head><meta charset=utf-8>" +
	    "<link rel=\"stylesheet\" href=\"/stylesheets/style.css\">" +
	    "</head><body>"
	);

    log_by_line.pipe(logFilter).pipe(res)
});

router.get(new RegExp('^/embedded/' + re_status), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': JENKINS_URL,
	'job': name
    });
    var log_by_line = byline(log);
    var logFilter = new LogFilter();

    log_by_line.pipe(logFilter).pipe(res)
});

router.get(new RegExp('^/raw/' + re_status), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': JENKINS_URL,
	'job': name
    });
    var log_by_line = byline(log);
    var simpleLogFilter = new SimpleLogFilter();

    log_by_line.pipe(simpleLogFilter).pipe(res)
});

router.get(new RegExp('^/original/' + re_status), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': JENKINS_URL,
	'job': name
    });
    var log_by_line = byline(log);
    var simpleLogFilter = new SimpleLogFilter();

    log.pipe(res)
});

router.get(new RegExp('^/code/' + re_status), function(req, res) {
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
	if (!err) {
	    info.duration = prettyMs(data.duration, { verbose: true });
	    if (data.building) {
		info.status = 'in progress'
	    } else if (data.result == 'SUCCESS') {
		info.status = 'success'
	    } else {
		info.status = 'error'
	    }
	}
	res.set('Content-Type', 'application/json')
	    .send(JSON.stringify(info));
    });
});

module.exports = router;
