
var multiline = require('multiline');
var urls = require('../lib/urls');
var mailgun = require('mailgun-js')(
  { apiKey: urls.mailgun_api_key, domain: urls.mailgun_domain });

var text_body = multiline(function() { /*
Dear R package developer!

This is your verification code for your R-hub check submission:

${code}

If you haven't submitted anything to R-hub, please ignore this email.

Have questions, suggestions or want to report a bug?
Please file an issue ticket at GitHub at
https://github.com/r-hub/rhub/issues Thank You for using the R-hub builder.

Sincerely,
The R-hub team

*/ });

function mail_token(email, token, callback) {

    var mail = {
	from: '"R-hub builder" <support@rhub.io>',
	to: email,
	subject: 'R-hub check email validation',
	text: text_body.replace("${code}", token)
    };

    mailgun.messages().send(mail, function(error, info) {
	if (error) {
	    console.log(error);
	    return callback(error);
	}
	console.log('Message sent: ' + info.response);
	callback(null, info.response);
    });
}

module.exports = mail_token;
