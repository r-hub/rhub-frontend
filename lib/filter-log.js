
var stream = require('stream');
var util = require('util');
var left_pad = require('left-pad');

// node v0.10+ use native Transform, else polyfill
var Transform = stream.Transform ||
    require('readable-stream').Transform;

function RHubLogFilter(options) {
    // allow use without new
    if (!(this instanceof RHubLogFilter)) {
	return new RHubLogFilter(options);
    }

    // init Transform
    Transform.call(this, options);
}
util.inherits(RHubLogFilter, Transform);

RHubLogFilter.prototype._transform = function (chunk, enc, cb) {

    // Line numbers
    if (!this.line_number) this.line_number = 1;
    var line = this.line_number;
    this.line_number += 1;
    var sp_line = left_pad(line, 4);

    chunk = chunk.toString();

    // Are we printing input or output?
    if (!this.output_mode) {
	this.output_mode = 'header';
	this.push(
	    '<h1 class="log-h1">Preparing</h1>' +
	    '<div class="log-block">'
	);
    }

    if (/echo >>>>>=====/.test(chunk)) {
	return cb();

    } else if (/^>>>>>=====/.test(chunk)) {
	chunk = chunk.replace(/^>>>>>=====* ?/, '');
	if (this.output_mode != 'header') { this.push('</div></div>'); }
	chunk = '<h1 class="log-h1">' + chunk +
	    '</h1><div class="log-block">';
	this.output_mode = 'header';

    } else {
	if (/^\++R-HUB-R-HUB-R-HUB/.test(chunk)) {
	    chunk = chunk.replace(/^\++R-HUB-R-HUB-R-HUB/, "");
	    if (this.output_mode != 'input') {
		if (this.output_mode == 'output') this.push('</div>');
		this.push('<div class="log-input">');
		this.output_mode = 'input';
	    }

	} else {
	    chunk = '#> ' + chunk;
	    if (this.output_mode != 'output') {
		if (this.output_mode == 'input') this.push('</div>');
		this.push('<div class="log-output">');
		this.output_mode = 'output';
	    }
	}

	chunk = '<a class="log-lineno" href="#L' + line + '">' +
	    '<span id="L' + line + '" class="log-lineno">' +
	    '<code>' + sp_line + '</code></span></a>' + chunk;
    }

    this.push(chunk + "<br>\n");
    cb();
};

function SimpleLogFilter(options) {
    // allow use without new
    if (!(this instanceof SimpleLogFilter)) {
	return new SimpleLogFilter(options);
    }

    // init Transform
    Transform.call(this, options);
}
util.inherits(SimpleLogFilter, Transform);

SimpleLogFilter.prototype._transform = function (chunk, enc, cb) {

    chunk = chunk.toString();

    if (/echo >>>>>=====/.test(chunk)) {
	return cb();

    } else if (/^>>>>>=====/.test(chunk)) {
	chunk = chunk.replace(/^>>>>>=====* ?/, '');

    } else {
	if (/^\++R-HUB-R-HUB-R-HUB/.test(chunk)) {
	    chunk = chunk.replace(/^\++R-HUB-R-HUB-R-HUB/, "");

	} else {
	    chunk = '#> ' + chunk;
	}
    }

    this.push(chunk + "\n");
    cb();
};

module.exports = RHubLogFilter;
module.exports.SimpleLogFilter = SimpleLogFilter;
