var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { 'advanced': false });
});

router.get('/advanced', function(req, res, next) {
    res.render('index', { 'advanced': true });
});

module.exports = router;
