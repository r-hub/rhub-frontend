var urls = require('../lib/urls.js');
var got = require('got');

function job_to_db(job, callback) {
    var doc = {
	id: job.buildId,
	email: job.email,
	package: job.package,
	version: job.version,
	submitted: job.submitted,
	platform: job.platforminfo,

	// to be filled later
	result: null,
	check_summary: null,
	check_output: null,
	build_time: null,
	builder_machine: null
    };

    var url = urls.logdb  + '/' + job.buildId;
    got.put(url, { body: doc }, function(err, reponse) {
	callback(err);
    });
}

module.exports = job_to_db;
