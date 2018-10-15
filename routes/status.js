
var express = require('express');
var router = express.Router();
var JenkinsLogStream = require('jenkins-log-stream');
var get_user = require('../lib/get-user');
var byline = require('byline');
var LogFilter = require('../lib/filter-log');
var SimpleLogFilter = require('../lib/filter-log').SimpleLogFilter;
var re_status = require('../lib/re-status');
const prettyMs = require('pretty-ms');
var urls = require('../lib/urls');

// This is the main page. The actual log will be in an IFrame

router.get(new RegExp('^/' + re_status + '$'), function(req, res) {
    var name = req.params[0];

    var iframeUrl = req.originalUrl.replace('/status', '/status/log');

    res.render(
	'status',
	{ 'buildId': name,
	  'user': get_user(req),
	  'logUrl': iframeUrl
	}
    );
});

function stream(log, res, filter) {
  var log_by_line = byline(log);
  if (filter === undefined) { filter = new LogFilter(); }

  var st = byline(log);

  if (filter !== null) { st = st.pipe(filter); }

  st.pipe(res)
    .on("error", function(e) { res.set(404).end("No such job"); });
}

router.get(new RegExp('^/log/' + re_status + '$'), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': urls.jenkins,
	'job': name
    });

    res.header("Content-Type", "text/html; charset=utf-8")
	.write(
	    "<!doctype html>" +
	    "<html lang=en><head><meta charset=utf-8>" +
	    "<link rel=\"stylesheet\" href=\"/stylesheets/style.css\">" +
	    "</head><body>"
	);

    stream(log, res);
});

router.get(new RegExp('^/embedded/' + re_status + '$'), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': urls.jenkins,
	'job': name
    });

    res.header("Content-Type", "text/html; charset=utf-8")

    stream(log, res);
});

router.get(new RegExp('^/raw/' + re_status + '$'), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': urls.jenkins,
	'job': name
    });
    var simpleLogFilter = new SimpleLogFilter();

    res.header("Content-Type", "text/plain")
    stream(log, res, simpleLogFilter);
});

router.get(new RegExp('^/original/' + re_status + '$'), function(req, res) {
    var name = req.params[0];
    var log = new JenkinsLogStream({
	'baseUrl': urls.jenkins,
	'job': name
    });

    res.header("Content-Type", "text/plain")
    stream(log, res, null);
});

router.get(new RegExp('^/code/' + re_status + '$'), function(req, res) {
    var name = req.params[0];

    var jenkins_url = urls.jenkins;
    var jenkins = require('jenkins');
    var conn = jenkins({ baseUrl: jenkins_url, crumbIssuer: true });

    var info = {
	'status': 'preparing',
	'submitted': 'moments ago',
	'duration': '...'
    };

    conn.build.get(name, 1, function(err, data) {
	res.set('Content-Type', 'application/json');
	if (err) {
	    res.status(404)
		.end(JSON.stringify({
		    "result": "error",
		    "message": "Job not found"
		}));

	} else {
	    info.duration = prettyMs(data.duration, { verbose: true });
	    if (data.building) {
		info.status = 'in progress'
	    } else if (data.result == 'SUCCESS') {
		info.status = 'success'
	    } else {
		info.status = 'error'
	    }
	    res.end(JSON.stringify(info));
	}
    });
});

module.exports = router;
