var fs = require('fs');
var path = require('path');
var queue = require('queue-async');
var blkt = require('blanket')({
  'data-cover-customVariable': 'window._$blanket'
});

module.exports = function(prefix, verbose, quiet, debug) {
    this.instrumentDir  = instrumentDir;
    this.instrumentFile = instrumentFile;
    this.cleanup = cleanup;

    function log(text) {
        if(verbose && !quiet) console.log(text);
    }

    function warn(text) {
        if(!quiet) console.warn(text);
    }

    var fileCount = 0;

    function cleanup(target, recursive) {
        function unlinkFile(target, counterObj) {
            if (path.basename(target).indexOf(prefix) != 0) return;

            try {
                fs.unlinkSync(target);
                counterObj.files++;
            } catch (err) {
                warn("Could not delete '" + target + "'");
                counterObj.failedFiles++;
            }
        }

        var counter = {
            files: 0,
            failedFiles: 0,
            dirs: 0
        };

        try {
            var stat = fs.statSync(target);
        } catch(error) {
            console.log('Omitting ' + target);
            return;
        }

        if (stat.isFile()) {
            unlinkFile(target, counter);
            counter.dirs++;
        }
        if (stat.isDirectory()) {
            traverseFileTree(target, recursive, unlinkFile, counter);
        }

        if (!quiet) console.log("Deleted " + counter.files + " file(s) in " + counter.dirs + " directory/directories. Could not delete " + counter.failedFiles + " file(s).");
    }

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

        traverseFileTree(dir, recursive, instrumentFile, counter);
    
        if(!quiet) console.log("Failed instrumenting " + counter.failedFiles + " of " + counter.files + " file(s) in " + counter.dirs + " directory/directories");
    }

    function traverseFileTree(dir, recursive, fileHandler, counterObj) {
        counterObj.dirs++;

        filesInDir = fs.readdirSync(dir);
        filesInDir.forEach(function(file) {
            file = path.join(dir, file);
            var stat = fs.statSync(file);
            if(stat.isDirectory() && recursive) {
                traverseFileTree(file, recursive, fileHandler, counterObj);
            }
            if(stat.isFile()) {
                fileHandler(file, counterObj);
            }
        });
    }
};
