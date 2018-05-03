
var get_maint = require('../lib/get-maint');
var get_image = require('../lib/get-image');
var get_pkg_from_filename = require('../lib/get-pkg-from-filename');
var get_version_from_filename = require('../lib/get-version-from-filename');
var r = require('rhub-node');

function create_job(req, callback) {

    var url = req.protocol + '://' + req.get('host') + "/file/" +
	req.file.filename;
    var pkg = get_pkg_from_filename(req.file.originalname);
    var version = get_version_from_filename(req.file.originalname);
    var logUrl = '/status/log/' + req.file.originalname + '-' +
	req.file.filename;

    var re_filename = new RegExp(
	'^' +
	r.valid_package_name +
	'_' +
	r.valid_package_version +
	'[.]tar[.]gz$');

    if (! req.body['build-package'] &&
	! re_filename.test(req.file.originalname)) {
        return callback(
	    "This does not look like an R package. " +
	    "Did you build it using 'R CMD build'?"
	)
    }

    var job = {
	'buildId': req.file.originalname + '-' + req.file.filename,
	'package': req.file.originalname,
	'filename': req.file.filename,
	'url': url,
	'size': req.file.size,
	'email': null,
	'pkg': pkg,
	'version': version,
	'logUrl': logUrl,
	'submitted': new Date().toISOString(),
	'builder': 'https://' + req.get('host')
    };

    // Get the image
    get_image(req.body.platform, function(err, platform) {
	if (err) { return callback(err); }
	job.platform = platform.name;
	job.image = platform["docker-image"];
	job.ostype = platform["os-type"];
	job.rversion = platform.rversion;
	job.platforminfo = platform;

        // Build options
        job.options = { };
        job.options.build = !! req.body['build-package'];

        // Fill in the maintainer
	if (req.body['alternative-email']) {
	    job.email = req.body['alternative-email'];
	    callback(null, job);

	} else {
	    var filename = __dirname + '/../uploads/' + req.file.filename;
	    get_maint(filename, function(err, maint) {
		if (err) { return callback(err); }
		job.email = maint;
		callback(null, job);
	    });
	}
    });
}

module.exports = create_job;
