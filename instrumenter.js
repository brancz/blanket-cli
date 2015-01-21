Error.stackTraceLimit = Infinity;

if(require.main === module) {
    console.log("This is just a module used by the main script. please call 'node cli' instead.");
    process.exit(1);
}

var fs = require('fs');
var path = require('path');
var clc = require('cli-color');
var ForkQueueManager = require("./fork_queue_manager");
var q = new ForkQueueManager(4, "./instrumenter.child.js");
var scriptWideCounter; 

var blkt = require('blanket')({
    "data-cover-customVariable": "window._$blanket"
}); //Seems to do strange things like overriding "require"

module.exports = function(prefix, verbose, quiet, debug) {
    this.instrumentDir  = instrumentDir;
    this.instrumentFile = instrumentFile;
    this.cleanup = cleanup;

    q.on("jobMessage", function (msg, jobsDoneCount) {
        if (msg.state === "skipped") {
            scriptWideCounter.skippedFiles++;
            return;
        }

        if (msg.state === "success") {
            scriptWideCounter.files++;
            log('Successfully instrumented ' + msg.file + " in " + msg.duration[0] + "s " + msg.duration[1] + "ns");
            log("Already instrumented " + scriptWideCounter.files + " file(s) in " + scriptWideCounter.dirs + " directory/directories");            
            return;
        }

        if (msg.state === "failure") {
            scriptWideCounter.failedFiles++;
            warn(clc.red("Cannot instrument '" + msg.file + "': " + msg.error.message));
            return;
        }
    });

    q.on("allJobsEnded", function (jobsDoneCount) {
        if(!quiet) {
            console.log();
            console.log(clc.green("Successfully instrumented " + scriptWideCounter.files + " file(s)."));
            console.log(clc.yellow("Skipped " + scriptWideCounter.skippedFiles + " file(s) because they were already instrumented or were instrumented files themselves. They can be removed by running in --cleanup mode."));
            console.log(clc.red("Failed instrumenting " + scriptWideCounter.failedFiles + " file(s). Probably because they were no valid JavaScript files." + ((!debug) ? " Run in debug and verbose mode (-d -v or -dv) for more details." : "")));
        }
    });

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

    function instrumentFile(target) {
        q.addJob([target, verbose, quiet, prefix]);
    }

    function instrumentDir(dir, recursive) {
        var counter = {
            files: 0,
            failedFiles: 0,
            dirs: 0,
            skippedFiles: 0
        };

        scriptWideCounter = counter;

        traverseFileTree(dir, recursive, instrumentFile, counter);

        q.start();
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
