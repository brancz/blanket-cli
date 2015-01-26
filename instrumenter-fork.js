Error.stackTraceLimit = Infinity;

var path = require('path');
var fileInstrumenter = require(path.join(__dirname, 'file-instrumenter'));
var bootstrapFork = require('reusable-forks-queue').bootstrapFork;

bootstrapFork(function (args) {
    fileInstrumenter(args.file, args.prefix);
});
