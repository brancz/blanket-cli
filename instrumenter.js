var fs = require('fs');
var path = require('path');
var queue = require('queue-async');
var blkt = require('blanket')({
  'data-cover-customVariable': 'window._$blanket'
});

module.exports = function(verbose, quiet) {
    function log(text) {
        if(verbose && !quiet) console.log(text);
    }

    function warn(text) {
        if(!quiet) console.warn(text);
    }

    var q = queue(50);

    function instrumentFile(target, verbose) {
        var startTime = process.hrtime();
        blkt.restoreBlanketLoader();
        try {
            fileContent = fs.readFileSync(target, 'utf-8');
            try {
                blkt.instrument({
                    inputFile: fileContent,
                    inputFileName: target
                }, function(instrumentedCode) {
                    q.defer(function() {
                        dir = path.dirname(target);
                        newFileName = 'instrumented+' + path.basename(target);
                        try {
                            fs.writeFile(path.join(dir, newFileName), instrumentedCode);
                            log('successfully instrumented ' + target);
                        } catch(err) {
                            warn(err);
                        }
                    });
                });
            } catch(err) {
                warn('cannot instrument         ' + target);
            }
        } catch(err) {
            warn(err);
        }
    }

    function instrumentDir(dir, recursive, verbose, quiet) {
        filesInDir = fs.readdirSync(dir);
        filesInDir.forEach(function(file) {
            file = path.join(dir, file);
            var stat = fs.statSync(file);
            if(stat.isDirectory()) {
                instrumentDir(file, recursive, verbose);
            }
            if(stat.isFile()) {
                instrumentFile(file, verbose);
            }
        });
    }

    this.instrumentDir  = instrumentDir;
    this.instrumentFile = instrumentFile;
};
