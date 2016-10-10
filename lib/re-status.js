
var r = require('rhub-node');

var re_status =
    '(' +
    '(' + r.valid_package_name + ')' +
    '_' +
    '(' + r.valid_package_version + ')' +
    '[.]tar[.]gz' + '-' +
    '([a-zA-Z0-9]+)' +
    ')';

module.exports = re_status;
