
const pool = require('../lib/project-pool');

function project_jobs(callback) {
  pool.connect(function(err, client, release) {
    if (err) throw err;

    // Connected

    client.query('SELECT NOW() AS NOW', function(err, res) {
      release();
      if (err) { release(); throw err; }

      // Query successful

      callback(null, res);
    })

  });
}

module.exports = project_jobs;
