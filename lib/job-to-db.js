
var urls = require('../lib/urls.js');
var got = require('got');
var url = require('url');

function job_to_db(job, callback) {
    var doc = {
	id: job.buildId,
	group: job.group,
	email: job.email,
	package: job.pkg,
	version: job.version,
	submitted: job.submitted,
        platform: job.platforminfo,
        scripts: job.scripts || null,
	checkArgs: job.checkArgs,
	envVars: job.envVars,

	// to be updated
	status: 'created',

	// to be filled later
	started: null,
	build_time: null,
	builder_machine: null,

	// these are parsed from the output logs
	result: null,
	check_output: null,
	preperror_log: null
    };

    var fullurl = urls.logdb  + '/' + doc.id;
    var _url = url.parse(fullurl);
    var dburl = _url.protocol + '//' + _url.host + _url.path;

    got.put(
	dburl,
	{ body: JSON.stringify(doc), auth: _url.auth },
	function(err, reponse) {
	callback(err);
    });
}

module.exports = job_to_db;
