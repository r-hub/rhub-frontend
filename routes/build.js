
var express = require('express');
var router = express.Router();
var re_status = require('../lib/re-status');
var urls = require('../lib/urls');
var db = require('nano')(urls.logdb);
var update_log = require('../lib/update-log');
var email_notification = require('../lib/email-notification');

function keep(x) { return '(' + x + ')'; }

var re_state = '[-A-Za-z]+';
var re_time = '[-a-zA-Z0-9:\\.]+';
var re = '^/' + keep(re_state) + '/' + re_status + '/' +
    keep(re_time) + '$';

// The job reports its state here. E.g.
// /in-progress/gpg_0.1.tar.gz-<...>/2016-10-10T02:59:00Z
// /success/igraph-1.0.1.tar.gz-<...>/2016-10-10T07:38:39Z
// Possible state values:
//    created, in-progress, success, failure, aborted, unstable, not_built
// These are the Jenkins build status values, except for in-progress
// and created.
//
// This should be ideally a POST request, but it is just easier to make
// a GET from the post-build Groovy script.

router.get(new RegExp(re), function(req, res) {
    var state = req.params[0];
    var id = req.params[1];	 // re_status is captured already
    var pkg = req.params[2];	 // within re_status
    var version = req.params[3]; // within re_status
    var hexid = req.params[4];	 // within re_status
    var time = req.params[5];

    function handle_error(err) {
	if (err) {
	    error(500, "Cannot update build " + id);
	} else {
	    ok(id + " updated");
	}
    }

    function error(status, message) {
	var msg = { "status": "error", "message": message };
	res.set(status)
	    .end(JSON.stringify(msg));
    }

    function ok(message) {
	res.set(200)
	    .end(JSON.stringify({ "status": "ok" }));
    }

    res.set('Content-Type', 'application/json');

    db.get(id, function(err, body) {
	if (err) { return error(res, 404, "Cannot find build " + id); }

	// We handle the simple 'start' update here
	if (state == "in-progress") {
	    body.status = state;
	    // This is to use the same machine's clock
	    body.started = new Date();
	    db.insert(body, function(err) {
		return handle_error(err);
	    });

	// More complicated updates need getting the Jenkins job and log,
	// we handle these separately
	} else {
	    update_log(id, state, time, body, function(err, body2) {
		if (err) { return handle_error(err); }
		db.insert(body2, function(err) {
		    if (err) { return handle_error(err); }
		    email_notification(body2, function(err) {
			return handle_error(err);
		    });
		});
	    });
	}
    });
});

module.exports = router;
