
var get_maint = require('../lib/get-maint');
var get_image = require('../lib/get-image');
var get_pkg_from_filename = require('../lib/get-pkg-from-filename');
var get_version_from_filename = require('../lib/get-version-from-filename');

function create_job(req, callback) {

    var url = req.protocol + '://' + req.get('host') + "/file/" +
	req.file.filename;
    var pkg = get_pkg_from_filename(req.file.originalname);
    var version = get_version_from_filename(req.file.originalname);
    var logUrl = '/status/log/' + req.file.originalname + '-' +
	req.file.filename;

    var job = {
	'buildId': req.file.originalname + '-' + req.file.filename,
	'package': req.file.originalname,
	'filename': req.file.filename,
	'url': url,
	'size': req.file.size,
	'email': null,
	'pkg': pkg,
	'version': version,
	'logUrl': logUrl
    };

    // Get the image
    get_image(req.body.platform, function(err, image) {
	if (err) { return callback(err); }
	job.image = image;

	// Fill in the maintainer
	var filename = __dirname + '/../uploads/' + req.file.filename;
	get_maint(filename, function(err, maint) {
	    if (err) { return callback(err); }
	    job.email = maint;
	    callback(null, job);
	});

    });
}

module.exports = create_job;
