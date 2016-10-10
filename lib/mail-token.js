
var nodemailer = require('nodemailer');
var multiline = require('multiline');
var urls = require('../lib/urls');

var SMTP_URL = urls.smtp_url;
var SMTP_SERVER = urls.smtp_server;

var text_body = multiline(function() { /*
Dear R package developer!

This is your verification code for your r-hub check submission:

${code}

If you haven't submitted anything to r-hub, please ignore this email.

Please reply to this email or contact support@r-hub.io if you have
questions.

Sincerely,
The r-hub team

*/ });

function mail_token(email, token, callback) {

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

    var mail = {
	from: '"r-hub builder" <support@r-hub.io>',
	to: email,
	subject: 'r-hub check email validation',
	text: text_body.replace("${code}", token)
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

module.exports = mail_token;
