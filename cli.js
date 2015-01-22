#!/usr/bin/env node
Error.stackTraceLimit = Infinity;

var program = require('commander');
var fs = require('fs');
var os = require('os');
var Instrumenter = require('./instrumenter');
var package = require('./package.json');

program
  .version(package.version)
  .description('Instrument javascript code for coverage analysis with blanket.js')
  .usage('[options] [target ...]')
  .option('-R, --recursive', 'Instrument a directory recursively')
  .option('-s, --separate [dir]', 'Separate instrumented files in different subdir')
  .option('-d, --debug', 'Display time used for overall processing. If used in combination with --verbose it display time used for each file to instrument')
  .option('-v, --verbose', 'Display some information on the current status')
  .option('-q, --quiet', 'Surpress warnings and log output')
  .option('-p, --parallelism <forks>', 'Spread work over n parallel processes (defaults to amount of available cpu cores)', os.cpus().length)
  .option('--prefix [prefix]', 'The prefix to use to indicate a file is instrumented (by default "instrumented-")', 'instrumented-')
  .option('--cleanup', 'Removes all files in the given targets starting with the given prefix');  

program.parse(process.argv);

if (!program.args.length) {
    program.help();
} else {
    process.on('exit', function(code) {
        var time = process.hrtime(global.startTime);
        if(program.debug) {
            console.log('Overall time needed for execution: ' + time[0] + 's ' + time[1] + 'ns');
        }
    });

    global.startTime = process.hrtime();
    program.args.forEach(function(target) {
        try {
            var stat = fs.statSync(target);
        } catch(error) {
            console.log('Omitting ' + target);
            return;
        }
        program.quiet = program.quiet || false;

        var instrumenter = new Instrumenter(program.prefix, program.verbose, program.quiet, program.debug, program.parallelism);

        if (program.cleanup) {
            instrumenter.cleanup(target);
            return;
        }

        if(stat.isDirectory()) {
            instrumenter.instrumentDir(target, program.recursive);
        }
        if(stat.isFile()) {
            instrumenter.instrumentFile(target);
        }
    });
}

