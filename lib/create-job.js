
function create_job(req, callback) {

    console.log(req.body.platform)

    var url = req.protocol + '://' + req.get('host') + "/file/" +
	req.file.filename;

    var job = {
	'package': req.file.originalname,
	'filename': req.file.filename,
	'url': url,
	'size': req.file.size,
	'email': 'csardi.gabor@gmail.com',
	'image': req.body.platform || 'debian-gcc-release' };

    callback(null, job);
}

module.exports = create_job;
