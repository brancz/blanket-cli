var fs = require('fs');
var path = require('path');
var queue = require('queue-async');
var blkt = require('blanket')({
  'data-cover-customVariable': 'window._$blanket'
});

module.exports = function(prefix, verbose, quiet, debug) {
    this.instrumentDir  = instrumentDir;
    this.instrumentFile = instrumentFile;

    function log(text) {
        if(verbose && !quiet) console.log(text);
    }

    function warn(text) {
        if(!quiet) console.warn(text);
    }

    var fileCount = 0;

    function instrumentFile(target, counterObj) {
        var startTime = process.hrtime();
        blkt.restoreBlanketLoader();
        try {
            fileContent = fs.readFileSync(target, 'utf-8');
            try {
                blkt.instrument({
                    inputFile: fileContent,
                    inputFileName: target
                }, function(instrumentedCode) {
                    dir = path.dirname(target);
                    newFileName = prefix + path.basename(target);
                    try {
                        fs.writeFileSync(path.join(dir, newFileName), instrumentedCode);
                        var endTime = process.hrtime(startTime);
                        counterObj.files++;

                        log('Successfully instrumented ' + target + " in " + endTime[0] + "s " + endTime[1] + "ns");
                        log("Already instrumented " + counterObj.files + " file(s) in " + counterObj.dirs + " directory/directories");
                    } catch(err) {
                        warn(err);
                        counterObj.failedFiles++;
                    }
                });
            } catch(err) {
                warn("Cannot instrument '" + target + "': " + err);
                counterObj.failedFiles++;
            }
        } catch(err) {
            warn(err);
            counterObj.failedFiles++;
        }
    }

    function instrumentDir(dir, recursive) {
        var counter = {
            files: 0,
            failedFiles: 0,
            dirs: 0
        };

        instrumentDirRecursion(dir, recursive, counter);
    
        if(!quiet) console.log("Failed instrumenting " + counter.failedFiles + " of " + counter.files + " file(s) in " + counter.dirs + " directory/directories");
    }

    function instrumentDirRecursion(dir, recursive, counterObj) {
        counterObj.dirs++;

        filesInDir = fs.readdirSync(dir);
        filesInDir.forEach(function(file) {
            file = path.join(dir, file);
            var stat = fs.statSync(file);
            if(stat.isDirectory() && recursive) {
                instrumentDirRecursion(file, recursive, counterObj);
            }
            if(stat.isFile()) {
                instrumentFile(file, counterObj);
            }
        });
    }
};
