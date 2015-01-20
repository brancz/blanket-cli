Error.stackTraceLimit = Infinity;

if(require.main === module) {
    console.log("This is just a module used by the main script. please call 'node cli' instead.");
    process.exit(1);
}

var fs = require('fs');
var path = require('path');
var clc = require('cli-color');
var blkt = require('blanket')({
  'data-cover-customVariable': 'window._$blanket'
});

module.exports = function(prefix, verbose, quiet, debug) {
    this.instrumentDir  = instrumentDir;
    this.instrumentFile = instrumentFile;
    this.cleanup = cleanup;

    function blanketInitializer(target, fileContent, done) {
        blkt.instrument({
            inputFile: fileContent,
            inputFileName: path.basename(target)
        }, done);        
    }

    function log(text) {
        if(verbose && !quiet) console.log(text);
    }

    function warn(text) {
        if(!quiet) console.warn(text);
    }

    var fileCount = 0;

    function cleanup(target, recursive) {
        function unlinkFile(target, counterObj) {
            if (!isInstrumentedFile(target)) return;

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

    function isInstrumentedFile(target) {
        return (path.basename(target).indexOf(prefix) == 0); 
    }

    function instrumentFile(target, counterObj) {
        var childProcess = require("child_process");
        var fork = childProcess.fork("instrumenter.child.js", [target, verbose, quiet, prefix]);
    }

    function instrumentDir(dir, recursive) {
        var counter = {
            files: 0,
            failedFiles: 0,
            dirs: 0,
            skippedFiles: 0
        };

        traverseFileTree(dir, recursive, instrumentFile, counter);
    
        if(!quiet) {
            console.log();
            console.log(clc.green("Successfully instrumented " + counter.files + " file(s)."));
            console.log(clc.yellow("Skipped " + counter.skippedFiles + " file(s) because they were already instrumented or were instrumented files themselves. They can be removed by running in --cleanup mode."));
            console.log(clc.red("Failed instrumenting " + counter.failedFiles + " file(s). Probably because they were no valid JavaScript files." + ((!debug) ? " Run in debug and verbose mode (-d -v or -dv) for more details." : "")));
        }
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
