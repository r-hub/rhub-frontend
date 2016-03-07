var queue_this = require('../lib/queue-this');

function queue_job(job) {
    queue_this('job', job );
}

module.exports = queue_job;
