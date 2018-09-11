
require('dotenv').config();

var urls = {
    'jenkins': process.env.JENKINS_URL,
    'validemail_url':
    process.env.DOKKU_REDIS_GREEN_URL || process.env.DOKKU_REDIS_PURPLE_URL,
    'logdb': process.env.LOGDB_URL,
    'mailgun_api_key': process.env.MAILGUN_API_KEY,
    'mailgun_domain': process.env.MAILGUN_DOMAIN || 'rhub.io'
};

module.exports = urls;
