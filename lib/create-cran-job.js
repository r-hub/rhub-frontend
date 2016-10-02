var uuid = require('uuid');
var get_cran_url = require('rhub-node').get_cran_pkg_url;
var parse_url = require('url').parse;
var path = require('path');
var get_image = require('../lib/get-image');
var get_version_from_filename = require('../lib/get-version-from-filename');

function create_cran_job(package, req, callback) {

    get_cran_url(package, undefined, function(err, pkgurl) {
	if (err) { return callback(err); }

	var pkgpath = parse_url(pkgurl).path;
	var filename = path.basename(pkgpath);
	var version = get_version_from_filename(filename);

	// filename is randomized, because that is used to name
	// the Jenkins project, and we need different project names
	// for submissions of the same package
	var hash = uuid.v4();
	var logUrl = '/status/log/' + filename + '-' + hash;

	var job = {
	    'buildId': filename + '-' + hash,
	    'package': filename,
	    'filename': hash,
	    'url': pkgurl,
	    'size': null,
	    'email': req.query.email,
	    'pkg': package,
	    'version': version,
	    'logUrl': logUrl,
	    'submitted': Date()
	};

	// Get the image
	get_image(req.query.platform, function(err, platform) {
	    if (err) { return callback(err); }
	    job.platform = platform.name;
	    job.image = platform["docker-image"];
	    job.ostype = platform["os-type"];
	    job.rversion = platform.rversion;

	    callback(null, job);
	});
    });
}

module.exports = create_cran_job;
