
function create_job(req, callback) {

    var url = req.protocol + '://' + req.get('host') + "/file/" +
	req.file.filename;

    var job = {
	'package': req.file.originalname,
	'filename': req.file.filename,
	'url': url,
	'size': req.file.size,
	'email': 'csardi.gabor@gmail.com' };

    callback(null, job);
}

module.exports = create_job;
