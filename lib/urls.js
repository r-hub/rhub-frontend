require('dotenv').config();

require('dotenv').config();

var urls = {
    'jenkins': process.env.JENKINS_URL,
    'validemail_url':
    process.env.DOKKU_REDIS_GREEN_URL || process.env.DOKKU_REDIS_PURPLE_URL,
    'logdb': process.env.LOGDB_URL,
    'smtp_url': process.env.SMTP_URL,
    'smtp_server': process.env.SMTP_SERVER,
    'projectdb': process.env.DATABASE_URL
};

module.exports = urls;
