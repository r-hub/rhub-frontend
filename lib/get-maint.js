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
		var maint = description.Maintainer;
		if (!!maint) {
		    maint = maint.replace(/^.*<(.*)>.*$/, "$1");
		    callback(null, maint);
		} else {
		    callback("No Maintainer field, invalid DESCRIPTION?");
		}

		extract.destroy();
	    })
	} else {
	    tarcb()
	}
    });

    extract.on('finish', function() {
	if (!done) { callback('No DESCRIPTION file'); }
    })

    extract.on('error', function() {
	callback('Cannot get maintainer, not an R package?');
	extract.destroy();
    })

    fs.createReadStream(tarball)
	.pipe(gunzip())
	.pipe(extract);
}

module.exports = get_maint;
