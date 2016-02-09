var queue_this = require('../lib/queue-this');

function queue_job(req) {

    var url = req.protocol + '://' + req.get('host') + "/file/" +
	req.file.filename;
    var job = {
	'package': req.file.originalname,
	'filename': req.file.filename,
	'url': url,
	'size': req.file.size };

    queue_this('job', job );
}

module.exports = queue_job;
