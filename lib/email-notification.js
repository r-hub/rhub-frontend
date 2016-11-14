
var fs = require('fs');
var mustache = require('mustache');
var nodemailer = require('nodemailer');
var urls = require('../lib/urls');
var pretty_ms = require('pretty-ms');

var SMTP_URL = urls.smtp_url;
var SMTP_SERVER = urls.smtp_server;

function email_notification(build, callback) {

    fs.readFile(
	'./data/email.txt',
	'utf8',
	function(err, text_body) {
	    if (err) { return callback(err); }

	    fs.readFile(
		'./data/email-inlined.html',
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
    var subject = build.package + ' ' + build.version + ': ' +
	build.status.toUpperCase();

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

    var backgrounds = {
	'ok': '#68B90F',
	'note': '#FF9F00',
	'warning': '#FF9F00',
	'error': '#D0021B',
	'preperror': '#D0021B'
    };

    var submitted = pretty_ms(
	new Date() - new Date(build.submitted),
	{ verbose: true }
    ) + ' ago';

    var lcstatus = build.status.toLowerCase();

    var dict = {
	'id': build.id,
	'title': subject,
	'header': subject,
	'result': build.result.status,
	'buildTime': pretty_ms(build.build_time, { verbose: true }),
	'submitted': submitted,
	'logHtml': 'https://builder.r-hub.io/status/' + build.id,
	'logText': 'https://builder.r-hub.io/status/original/' + build.id,
	'artifactLink': 'https://artifacts.r-hub.io/' + build.id,
	'anyErrors': build.result.errors.length > 0,
	'errors': build.result.errors,
	'anyWarnings': build.result.warnings.length > 0,
	'warnings': build.result.warnings,
	'anyNotes': build.result.notes.length > 0,
	'notes': build.result.notes,
	'platform': build.platform.description,
	'bgIsRed': lcstatus == 'error' || lcstatus == 'preperror' ||
	    lcstatus == "aborted",
	'bgIsOrange': lcstatus == 'warning' || lcstatus == 'note',
	'bgIsGreen': lcstatus == 'ok'
    };

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
