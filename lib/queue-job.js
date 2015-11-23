var queue_this = require('../lib/queue-this');

function queue_job(file, body) {

    var job = {
	'package': file.originalname,
	'filename': file.filename,
	'size': file.size };

    queue_this('job', job );
}

module.exports = queue_job;
