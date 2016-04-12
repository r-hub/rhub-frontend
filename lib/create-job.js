
var get_maint = require('../lib/get-maint');
var get_image = require('../lib/get-image');

function create_job(req, callback) {

    var url = req.protocol + '://' + req.get('host') + "/file/" +
	req.file.filename;

    var job = {
	'package': req.file.originalname,
	'filename': req.file.filename,
	'url': url,
	'size': req.file.size,
	'email': null
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
	    console.log(job);
	    callback(null, job);
	});

    });
}

module.exports = create_job;
