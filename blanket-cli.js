var fs           = require('fs');
var Instrumenter = require('./instrumenter');

const DEFAULT_PREFIX = "instrumented-";

var BlanketCLI = function(targets, options) {
    var targets = targets;
    var options = options;

    this.run = function() {
        process.on('exit', function(code) {
            var time = process.hrtime(global.startTime);
            if(options.debug) {
                console.log('Overall time needed for execution: ' + time[0] + 's ' + time[1] + 'ns');
            }
        });

        global.startTime = process.hrtime();
        targets.forEach(function(target) {
            try {
                var stat = fs.statSync(target);
            } catch(error) {
                console.log('Omitting ' + target);
                return;
            }

            options.quiet = options.quiet || false;
            if (options.separate && options.prefix === undefined) options.prefix = '';
            if (options.prefix === undefined) options.prefix = DEFAULT_PREFIX;

            if (options.verbose) {
                console.log(targets);
                printWorkingParameters(options);
            }
            
            var instrumenter = new Instrumenter(options.prefix, options.verbose, options.quiet, options.debug, options.parallelism);

            if (options.cleanup) {
                instrumenter.cleanup(target, options.separate, options.recursive);
                return;
            }

            if(stat.isDirectory()) {
                instrumenter.instrumentDir(target, options.separate, options.recursive);
            }
            if(stat.isFile()) {
                instrumenter.instrumentSingleFile(target);
            }
        });
    };
};

function printWorkingParameters(program) {
  for (var option in program.options) {
    var key = program.options[option].long.substr(2);

    if (key === 'version') continue;

    var value = program[key];
    if (value === undefined) value = 'not set';

    console.log(key + ': ' + value);
  }
}

module.exports = BlanketCLI;
