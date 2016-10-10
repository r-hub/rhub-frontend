
var urls = {
    'validemail_url':
    process.env.DOKKU_REDIS_GREEN_URL || process.env.DOKKU_REDIS_PURPLE_URL,
    'logdb': process.env.LOGDB_URL

};

module.exports = urls;
