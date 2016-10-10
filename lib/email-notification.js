
var mustache = require('mustache');
var nodemailer = require('nodemailer');
var multiline = require('multiline');
var urls = require('../lib/urls');

var SMTP_URL = urls.smtp_url;
var SMTP_SERVER = urls.smtp_server;

var text_body = multiline(function() { /*

Check result: {{ status }}

Errors:

{{#result.errors}}
{{.}}
{{/result.errors}}

Warnings:

{{#result.warnings}}
{{.}}
{{/result.warnings}}

Notes:

{{#result.notes}}
{{.}}
{{/result.notes}}

*/ });

var html_body = multiline(function() { /*

<h2>Check result: {{ status }}</h2>

<h3>Errors:</h3>

{{#result.errors}}
<pre>
{{.}}
</pre>
{{/result.errors}}

<h3>Warnings:</h3>

{{#result.warnings}}
<pre>
{{.}}
</pre>
{{/result.warnings}}

<h3>Notes:</h3>

{{#result.notes}}
<pre>
{{.}}
</pre>
{{/result.notes}}

*/ });

function email_notification(build, callback) {

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
