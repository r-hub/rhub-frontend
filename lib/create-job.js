
var get_maint = require('../lib/get-maint');

function create_job(req, callback) {

    var url = req.protocol + '://' + req.get('host') + "/file/" +
	req.file.filename;

    var job = {
	'package': req.file.originalname,
	'filename': req.file.filename,
	'url': url,
	'size': req.file.size,
	'email': null,
	'image': req.body.platform || 'debian-gcc-release' };

    // Fill in the maintainer
    var filename = __dirname + '/../uploads/' + req.file.filename;
    get_maint(filename, function(err, maint) {
	if (err) { return callback(err); }
	job.email = maint;
	callback(null, job);
    })
}

module.exports = create_job;
