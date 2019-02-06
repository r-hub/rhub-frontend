
var multiline = require('multiline');
var uuid = require('uuid');
var urls = require('../lib/urls');
var mailgun = require('mailgun-js')(
  { apiKey: urls.mailgun_api_key, domain: urls.mailgun_domain });

var redis = require('redis');
var cli_client = redis.createClient(urls.validemail_url);

var text_body = multiline(function() { /*
Dear R package developer!

This is your verification code for your R-hub builder upload: ${code}

If you haven't uploaded anything to R-hub, please ignore this email.

Please reply to this email or contact support@rhub.io if you have
questions.

Sincerely,
The R-hub team

*/ });

function mail_verification_code(req, callback) {

    var code = uuid.v4().substring(0, 6);

    cli_client.set(req.session.job.email + '-pending', code, function(err) {
	if (err) {
	    // Could not add code to CLI validation DB, but nevertheless
	    // we continue, because it will still work with the web app
	    console.log("cannot add validation code to CLI app DB")
	}

	req.session.verification = code;

	var mail = {
	    from: '"R-hub builder" <support@rhub.io>',
	    to: req.session.job.email,
	    subject: 'R-hub builder verification',
	    text: text_body.replace("${code}", code)
	};

        mailgun.messages().send(mail, function(error, info)  {
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
