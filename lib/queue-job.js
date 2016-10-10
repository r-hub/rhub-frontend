var queue_this = require('../lib/queue-this');
var job_to_db = require('../lib/job-to-db');

function queue_job(job) {
    job_to_db(job, function(err) {
	// Report error, but continue, anyway. We'll try to add it later
	if (err) { console.log("Cannot add new job to DB") }

	// Add it to the queue as well
	queue_this('job', job );
    });
}

module.exports = queue_job;
