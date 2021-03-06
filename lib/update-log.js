
var got = require('got');
var urls = require('../lib/urls');
var jenkins = require('jenkins')( { baseUrl: urls.jenkins });
var parse_rhub_log = require('../lib/parse-rhub-log');

function update_log(id, state, time, body, callback) {
    // Need to get the build metadata and the output from Jenkins
    jenkins.build.get(id, 'lastBuild', function(err, data) {
	if (err) { return callback("Cannot find Jenkins job"); }

	// We cannot use data.duration, because at this point the build
	// is still running, and it is set to 0
	body.build_time = new Date() - new Date(body.started);
	body.builder_machine = data.builtOn;

	jenkins.build.log(id, 'lastBuild', function(err, log) {
	    if (err) { return callback("Cannot get Jenkins log"); }
	    var parsed = parse_rhub_log(body.platform["output-parser"], log);
	    body.result = parsed.result;
	    body.check_output = parsed.check_output;
	    body.preperror_log = parsed.preperror_log;

	    if (data.result == "ABORTED") {
		body.status = "aborted";
		body.result.status = "aborted"; // for consistency
	    } else {
		body.status = parsed.result.status;
	    }

	    callback(null, body);
	});
    });
}

module.exports = update_log;
