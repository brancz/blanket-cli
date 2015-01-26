Error.stackTraceLimit = Infinity;

var path = require('path');
var bootstrapFork = require('reusable-forks-queue').bootstrapFork;
var fileInstrumenter = require(path.join(__dirname, 'file-instrumenter'));

bootstrapFork(function (args) {
    fileInstrumenter(args.file, args.prefix);
});
