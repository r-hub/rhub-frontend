
var nodemailer = require('nodemailer');
var multiline = require('multiline');
var uuid = require('uuid');

var SMTP_URL = process.env.SMTP_URL;
var SMTP_SERVER = process.env.SMTP_SERVER;

var redis = require('redis');
var urls = require('../lib/urls');
var cli_client = redis.createClient(urls.validemail_url);

var text_body = multiline(function() { /*
Dear R package developer!

This is your verification code for your r-hub builder upload: ${code}

If you haven't uploaded anything to r-hub, please ignore this email.

Please reply to this email or contact support@r-hub.io if you have
questions.

Sincerely,
The r-hub team

*/ });

function mail_verification_code(req, callback) {

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

    var code = uuid.v4().substring(0, 6);

    cli_client.set(req.session.job.email + '-pending', code, function(err) {
	if (err) {
	    // Could not add code to CLI validation DB, but nevertheless
	    // we continue, because it will still work with the web app
	    console.log("cannot add validation code to CLI app DB")
	}

	req.session.verification = code;

	var mail = {
	    from: '"r-hub builder" <support@r-hub.io>',
	    to: req.session.job.email,
	    subject: 'r-hub builder verification',
	    text: text_body.replace("${code}", code)
	};

	transporter.sendMail(mail, function(error, info) {
	    if (error) {
		console.log(error);
		return callback(error);
	    }
	    console.log('Message sent: ' + info.response);
	    callback(null, info.response);
	});
    })
}

module.exports = mail_verification_code;
