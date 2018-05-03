
var express = require('express');
var router = express.Router();
var queue_github_job = require('../lib/queue-github-job');
var rex = require('../lib/regexps');
var project_jobs = require('../lib/project-jobs');

// /ci/-/hook

router.post('/-/hook', function(req, res, next) {
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

// /ci

router.get('/', function(req, res, next) {
  project_jobs(function(err, jobs) {
    if (err) {
      // TODO
    } else  {
      return res.send('foobar');
      res.render('ci', {
	partials: { jobs: 'jobs.html' },
	jobs: jobs
      });
    }
  })
});

// /ci/{user}

var re_user = new RegExp('^/' + rex.user + '/?$');

router.get(re_user, function(req, res, next)  {

});

// /ci/{user}/{repo}

var re_repo = new RegExp('^/' + rex.user + '/' + rex.repo + '/?$');

router.get(re_repo, function(req, res, next) {

});

// /ci/{user}/-/new

var re_new = new RegExp('^/' + rex.user + '/-/new$');

router.get(re_new, function(req, res, next) {

});

// /ci/{user}/{repo}/branch/{branch}

var re_branch = new RegExp('^/' + rex.user + '/' + rex.repo +
			   '/branch/' + rex.branch + '/?$');

router.get(re_branch, function(req, res, next) {

});

// /ci/{user}/{repo}/build/{build_id}

var re_build = new RegExp('^/' + rex.user + '/' + rex.repo +
			  '/build/' + rex.build  + '/?$');

router.get(re_build, function(req, res, next) {

});

module.exports = router;
