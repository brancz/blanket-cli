#!/usr/bin/env node
Error.stackTraceLimit = Infinity;

var program    = require('commander');
var os         = require('os');
var path       = require('path');
var version    = require(path.join(__dirname, '../package.json')).version;
var BlanketCLI = require(path.join(__dirname, '../blanket-cli.js'));

program
  .version(version)
  .description('Instrument javascript code for coverage analysis with blanket.js')
  .usage('[options] [target ...]')
  .option('-R, --recursive', 'Instrument a directory recursively')
  .option('-s, --separate [dir]', 'Separate instrumented files in different subdir', "")
  .option('-d, --debug', 'Display time used for overall processing. If used in combination with --verbose it display time used for each file to instrument', false)
  .option('-v, --verbose', 'Display some information on the current status')
  .option('-q, --quiet', 'Surpress warnings and log output')
  .option('-p, --parallelism <forks>', 'Spread work over n parallel processes (defaults to amount of available cpu cores)', os.cpus().length)
  .option('--prefix [prefix]', 'The prefix to use to indicate a file is instrumented (by default "instrumented-" or empty when run with -s flag)')
  .option('--cleanup', 'Removes all files in the given targets starting with the given prefix');  

program.parse(process.argv);

if (!program.args.length) {
    program.help();
    process.exit(0);
}

var targets = program.args;
var options = program;

console.log(targets);

new BlanketCLI(targets, options).run();
