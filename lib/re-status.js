
var r = require('rhub-node');

var re_status =
    '(' +
    '(' + '[-a-zA-Z0-9\._]+' + ')' +
    '[.]tar[.]gz' + '-' +
    '([a-zA-Z0-9]+)' +
    ')';

module.exports = re_status;
