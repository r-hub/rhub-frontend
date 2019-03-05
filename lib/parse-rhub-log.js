
// Parse a full R-hub log.
// Returns two things:
// * result: the check result, a JSON dict with entries:
//    - status (preperror, error, warning, note, ok)
//    - notes
//    - warnings
//    - errors
// * check_output: the output of R CMD check. This is null if the build
//   fails before getting to runing R CMD check.
// * preperror_log: the last 100 lines of the build, if preperror

function parse_rhub_log(parser, log) {

    if (!parser || parser == "rcmdcheck") {
	return parse_rcmdcheck_log(log);
    } else if (parser == "sanitizers") {
	return parse_sanitizers_log(log);
    } else if (parser == "rchk") {
	return parse_rchk_log(log);
    } else {

	var last_lines = log.split(/\n/)
	    .slice(-100)
	    .join('\n');

	return {
	    'result': {
		'status': 'parseerror',
		'notes': [],
		'warnings': [],
		'errors': [] },
	    'check_output': log,
	    'preperror_log': last_lines
	};
    }
}

function parse_preperror_log(log) {
    var last_lines = log.split(/\n/)
	.slice(-100)
	.join('\n');

    return {
	result: {
	    'status': 'preperror',
	    'notes': [],
	    'warnings': [],
	    'errors': [] },
	check_output: null,
	preperror_log: last_lines
    };
}

// R CMD check logs ------------------------------------------------------

function parse_rcmdcheck_log(log) {

    var check_start_regex = />>>>>======* Running R CMD check/;
    var check_done_regex = /\n[*] DONE[\n ]/;

    // If we don't have this in the log, then we never got to checking
    if (check_start_regex.test(log) && check_done_regex.test(log)) {

	// Not sure why it would appear multiple times, but we handle
	// it nervertheless
	var checklog = log.replace(/\r\n/g, '\n')
	    .split(check_start_regex)
	    .slice(1)
	    .join('\n');

	return parse_rcmdcheck_log2(checklog);

    } else {
	return parse_preperror_log(log);
    }
}

function parse_rcmdcheck_log2(log) {

    var last_lines = log.split(/\n/)
	.slice(-100)
	.join('\n');

    // Drop stuff after the final DONE
    var mylog = log.replace(/\n[*] DONE\n\n?(.|\n)*$/, '\n* DONE\n\n');

    var pieces = mylog
	.replace(/^NOTE: There was .*\n$/, "")
	.replace(/^WARNING: There was .*\n$/, "")
	.split("\n* ");

    function filter(pattern) {
	var re = new RegExp(pattern);
	return pieces.filter(
	    function(x) { return re.test(x); }
	);
    }

    var errors = filter(' ERROR(\n|$)');
    var warnings = filter(' WARNING(\n|$)');
    var notes = filter(' NOTE(\n|$)');
    var result;

    if (errors.length) {
	result = 'error'
    } else if (warnings.length) {
	result = 'warning'
    } else if (notes.length) {
	result = 'note'
    } else {
	result = 'ok'
    }

    return {
	'result': {
	    'status': result,
	    'notes': notes,
	    'warnings': warnings,
	    'errors': errors },
	'check_output': mylog,
	'preperror_log': last_lines
    };
}

// Saniters log ----------------------------------------------------------

function parse_sanitizers_log(log) {

    var check_start_regex = />>>>>======* Running R CMD check/;
    var check_done_regex = />>>>>======* Done with R CMD check/;

    if (check_start_regex.test(log) && check_done_regex.test(log)) {
	var mylog = log.replace(/\r\n/g, '\n')
	    .split(check_start_regex)
	    .slice(1)
	    .join('\n')
	    .split(check_done_regex)[0];

	return parse_sanitizers_log2(mylog);
    } else {
	return parse_preperror_log(log);
    }
}

function parse_sanitizers_log2(log) {

    var last_lines = log.split(/\n/)
	.slice(-100)
	.join('\n');
    var status;

    if (/runtime error:/.test(log)) {
	return {
	    'result': {
		'status': 'error',
		'notes': [],
		'warnings': [],
		'errors': log },
	    'check_output': log,
	    'preperror_log': last_lines
	};

    } else {
	return {
	    'result': {
		'status': 'ok',
		'notes': [],
		'warnings': [],
		'errors': [] },
	    'check_output': log,
	    'preperror_log': null
	};
    }
}

// rchk log --------------------------------------------------------------

function parse_rchk_log(log) {

    var check_start_regex = />>>>>======* Running R CMD check/;
    var check_done_regex  = />>>>>======* Done with R CMD check/;

    if (check_start_regex.test(log) && check_done_regex.test(log)) {
	var mylog = log.replace(/\r\n/g, '\n')
	    .split(check_start_regex)
	    .slice(1)
	    .join('\n')
	    .split(check_done_regex)[0];

	return parse_rchk_log2(mylog);
    } else {
	return parse_preperror_log(log);
    }
}

function parse_rchk_log2(log) {

    var last_lines = log.split(/\n/)
	.slice(-100)
	.join('\n');
    var status;

    if (/error/i.test(log) || /warning/i.test(log) ||
	/\n\nFunction/.test(log)) {
	return {
	    'result': {
		'status': 'error',
		'notes': [],
		'warnings': [],
		'errors': log },
	    'check_output': log,
	    'preperror_log': last_lines
	};

    } else {
	return {
	    'result': {
		'status': 'ok',
		'notes': [],
		'warnings': [],
		'errors': [] },
	    'check_output': log,
	    'preperror_log': null
	};
    }
}

module.exports = parse_rhub_log;
