
var get_user = require('../lib/get-user');

function auth_ok(req, job) {
    if (!req.isAuthenticated()) { return false; }

    var user = get_user(req);
    if (!user) { return false; }

    return user.user == job.email;
}

module.exports = auth_ok;
