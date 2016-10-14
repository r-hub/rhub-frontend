
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

function parse_rhub_log(log) {

    var check_start_regex = />>>>>======* Running R CMD check/;

    // If we don't have this in the log, then we never got to checking
    if (check_start_regex.test(log)) {

	// Not sure why it would appear multiple times, but we handle
	// it nervertheless
	var checklog = log.replace('\r\n', '\n')
	    .split(check_start_regex)
	    .slice(1)
	    .join('\n');

	return parse_rcmd_check_log(checklog);

    } else {
	return parse_preperror_log(log);
    }
}

function parse_preperror_log(log) {
    var last_lines = log.split(/\r?\n/)
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

function parse_rcmd_check_log(log) {

    // Drop stuff after the final DONE
    var mylog = log.replace(/\n[*] DONE\n\nStatus:(.|\n)*$/, '\n* DONE\n\n');

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
	'preperror_log': null
    };
}

module.exports = parse_rhub_log;
