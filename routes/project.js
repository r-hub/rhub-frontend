var express = require('express');
var router = express.Router();
var queue_github_job = require('../lib/queue-github-job');

router.post('/hook', function(req, res, next) {
  var event = req.get('X-GitHub-Event');

  console.log(req);

  res.set('Content-Type',  'application/json')

  if (event !==  'push') {
    res.set(200)
      .send('{ "status": "OK" }');
    return;
  }

  queue_github_job(req.body);
  res
    .set(201)
    .send('{ "status": "OK" }');

});

module.exports = router;
