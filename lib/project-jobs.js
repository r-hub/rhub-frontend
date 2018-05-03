
const urls = require('../lib/urls');
const db = urls.projectdb;
const { Client } = require('pg');

function project_jobs(callback) {
  const client = new Client({connectionString: db});
  client.connect(function(err) {
    if (err) throw err;

    console.log("connected");

    client.query('SELECT NOW()', function(err, res) {
      if (err) throw err;
      console.log("queried");
      console.log(res);
      callback(err, 'foobar');
      client.end(function(err) {
	if (err) throw err;
	console.log("disconnected");
      });
    })

  });
}

module.exports = project_jobs;
