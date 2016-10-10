
var fs = require('fs');
var mustache = require('mustache');
var nodemailer = require('nodemailer');
var urls = require('../lib/urls');

var SMTP_URL = urls.smtp_url;
var SMTP_SERVER = urls.smtp_server;

function email_notification(build, callback) {

    fs.readFile(
	'./data/email.txt',
	'utf8',
	function(err, text_body) {
	    if (err) { return callback(err); }

	    fs.readFile(
		'./data/email.html',
		'utf8',
		function(err, html_body) {
		    if (err) { return callback(err); }

		    email_with_template(
			build,
			text_body,
			html_body,
			callback
		    );
		}
	    );

	}
    );
}

function email_with_template(build, text_body, html_body, callback) {

    var email = build.email;
    var subject = build.package + ' ' + build.version + 'check result: ' +
	build.status;

    if (!SMTP_URL && !SMTP_SERVER) { return callback("No mail server"); }

    var transporter;
    if (SMTP_URL) {
	transporter = nodemailer.createTransport(SMTP_URL);
    } else {
	transporter = nodemailer.createTransport({
	    host: SMTP_SERVER,
	    tls: { rejectUnauthorized: false }
	});
    }

    var dict = build;

    var mail = {
	from: '"r-hub builder" <support@r-hub.io>',
	to: email,
	subject: subject,
	text: mustache.render(text_body, dict),
	html: mustache.render(html_body, dict)
    };

    transporter.sendMail(mail, function(error, info) {
	if (error) {
	    console.log(error);
	    return callback(error);
	}
	console.log('Message sent: ' + info.response);
	callback(null, info.response);
    });
}

module.exports = email_notification;
