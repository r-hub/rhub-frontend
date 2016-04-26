
function get_user(req) {
    if (! req.isAuthenticated()) { return null; }

    var user = req.session.passport.user;

    if (user.startsWith('github:')) {
	user = user.replace(/^github:/, '');
	user = JSON.parse(user);
	return { 'via': 'GitHub', 'user': user[0].value };

    } else if (user.startsWith('email:')) {
	user = user.replace(/^email:/, '');
	return { 'via': 'Email verification', 'user': user };

    } else {
	// Unknown login type, how did this happen?
	return null;
    }
}

module.exports = get_user;
