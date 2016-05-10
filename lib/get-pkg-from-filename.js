
var r = require('rhub-node');

function get_pkg_from_filename(filename) {
    var re = new RegExp('^(' + r.valid_package_name + ')_');
    var match = re.exec(filename);
    if (match) { return match[1]; } else { return null; }
}

module.exports = get_pkg_from_filename;
