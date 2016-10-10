
var urls = require('../lib/urls.js');
var got = require('got');
var url = require('url');

function job_to_db(job, callback) {
    var doc = {
	id: job.buildId,
	email: job.email,
	package: job.pkg,
	version: job.version,
	submitted: job.submitted,
	platform: job.platforminfo,

	// to be updated
	status: 'created',

	// to be filled later
	result: null,
	check_summary: null,
	check_output: null,
	build_time: null,
	builder_machine: null
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
