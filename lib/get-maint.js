var tar = require('tar-stream');
var gunzip = require('gunzip-maybe');
var fs = require('fs');
var desc = require('rdesc-parser');

function get_maint(tarball, callback) {

    var extract = tar.extract();
    var done = false;

    extract.on('entry', function(header, stream, tarcb) {
	if (!done && header.name.match(/^[^\/]+\/DESCRIPTION$/)) {
	    done = true;
	    stream.setEncoding('utf8');
	    desc(stream, function(err, description) {
		if (err) { return callback(err); }
		callback(null, description.Maintainer);
		tarcb();
	    })
	} else {
	    tarcb()
	}
    });

    extract.on('finish', function() {
	if (!done) { callback('No DESCRIPTION file'); }
    })

    fs.createReadStream(tarball)
	.pipe(gunzip())
	.pipe(extract);
}

module.exports = get_maint;
