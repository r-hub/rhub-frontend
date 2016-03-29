var uuid = require('uuid');
var get_cran_url = require('rhub-node').get_cran_pkg_url;
var parse_url = require('url').parse;
var path = require('path');

function create_cran_job(package, req, callback) {

    get_cran_url(package, undefined, function(err, pkgurl) {
	if (err) { return callback(err); }

	var pkgpath = parse_url(pkgurl).path;
	var filename = path.basename(pkgpath);

	// filename is randomized, because that is used to name
	// the Jenkins project, and we need different project names
	// for submissions of the same package
	var job = {
	    'package': filename,
	    'filename': uuid.v4(),
	    'url': pkgurl,
	    'size': null,
	    'email': req.query.email,
	    'image': req.query.platform || 'debian-gcc-release' };

	callback(null, job);
    })
}

module.exports = create_cran_job;
