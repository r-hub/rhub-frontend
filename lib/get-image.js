var fs = require('fs');

function get_image(platform, callback) {
    fs.readFile(
	'./public/data/platforms.json',
	'utf8',
	function(err, json) {
	    if (err) { return callback(err); }
	    var platforms = JSON.parse(json);
	    var image = null;
	    for (i = 0; i < platforms.length; i++) {
		if (platforms[i].name === platform) {
		    image = platforms[i]['docker-image'];
		}
	    }
	    if (image === null) {
		callback('Unknown platform');
	    } else {
		callback(null, image);
	    }
	}
    );
}

module.exports = get_image;
