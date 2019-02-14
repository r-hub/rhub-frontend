
function check_token(client, req, res, callback) {

    var token = (req.headers.authorization || '').split(' ');

    if (! req.params.email || token.length != 2 || token[0] != 'token' ||
	token[1] == '') {
	res.set('Content-Type', 'application/json; charset=utf-8')
	    .status(400)
	    .end(JSON.stringify({
		"result": "error",
		"message": "Authorization failed, email or token is missing." }));
	callback('No email or token');
	return;
    }

    client.get(req.params.email, function(err, dbtoken) {
	if (err || token[1] != dbtoken) {
	    res.set('Content-Type', 'application/json; charset=utf-8')
		.status(401)
		.end(JSON.stringify({
		    "result": "error",
		    "message": "Email address not validated"
		}));
	    callback('Email not validated');
	    return;
	}
	callback(null, req.params.email);
	return;
    });
}

module.exports = check_token;
