
var get_package_data = require('../lib/get-package-data');
var get_image = require('../lib/get-image');
var r = require('rhub-node');

function create_job(req, callback) {

    var url = req.protocol + '://' + req.get('host') + "/file/" +
	req.file.filename;
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

        // Fill in the maintainer, package  name and version
        var filename = __dirname + '/../uploads/' + job.filename;
        get_package_data(filename, function(err, data) {
	  if (err) { return callback(err); }
	  job.email = data.maint;
	  job.pkg = data.Package;
	  job.version = data.Version;
	  if (req.body['alternative-email']) {
	    job.email = req.body['alternative-email'];
	  }
	  if (!job.email) { return(callback("Cannot find 'Maintainer'")); }
	  if (!job.pkg) { return(callback("Cannot find package name")); }
	  if (!job.version) { return(callback("Cannot find package version")); }
	  callback(null, job);
	})
    });
}

module.exports = create_job;
