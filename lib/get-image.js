var fs = require('fs');

function get_image(platform, callback) {
    fs.readFile(
	'./public/data/platforms.json',
	'utf8',
	function(err, json) {
	    if (err) { return callback(err); }

	    var platforms = JSON.parse(json);

	    // Default platform, this should be ideally declared in
	    // platforms.json. Anyway.
	    if (platform === null || platform === undefined) {
		return callback(
		    null,
		    { platform: platforms[0]['name'],
		      ostype: platforms[0]['os-type'],
		      image: platforms[0]['docker-image'] }
		);
	    }

	    var image = null;
	    for (i = 0; i < platforms.length; i++) {
		if (platforms[i].name === platform) {
		    return callback(
			null,
			{ platform: platforms[i]['name'],
			  ostype: platforms[i]['os-type'],
			  image: platforms[i]['docker-image'] }
		    );
		}
	    }
	    callback('Unknown platform');
	}
    );
}

module.exports = get_image;
