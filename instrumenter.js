Error.stackTraceLimit = Infinity;

if(require.main === module) {
    console.log("This is just a module used by the main script. please call 'node cli' instead.");
    process.exit(1);
}

var fs = require('fs');
var path = require('path');
var clc = require('cli-color');
var ReusableForksQueue = require("reusable-forks-queue").ReusableForksQueue;
var common = require(path.join(__dirname, "instrumenter-common.js"));

module.exports = function(prefix, verbose, quiet, debug, parallelism, embedSource, trace) {
    this.instrumentDir  = instrumentDir;
    this.instrumentFile = instrumentFile;
    this.instrumentSingleFile = instrumentSingleFile;
    this.cleanup = cleanup;

    var scriptWideCounter; 
    var filesAddedToQueueCount = 0;

    var counter = {
        files: 0,
        failedFiles: 0,
        dirs: 0,
        skippedFiles: 0
    };

    var q = new ReusableForksQueue(path.join(__dirname, "instrumenter-fork.js"), parallelism);

    q.on("jobMessage", function (msg, jobsDoneCount) {
        if (msg.state === "skipped") {
            scriptWideCounter.skippedFiles++;
            return;
        }

        if (msg.state === "success") {
            scriptWideCounter.files++;
            log('Successfully instrumented ' + msg.file + " in " + msg.duration[0] + "s " + msg.duration[1] + "ns");
            log("Instrumented " + scriptWideCounter.files + " file(s) in " + scriptWideCounter.dirs + " directory/directories"); 

            return;
        }

        if (msg.state === "failure") {
            scriptWideCounter.failedFiles++;

            warn(clc.red("Cannot instrument '" + msg.file + "': " + msg.error));
            return;
        }
    });

    q.on("jobEnded", function (jobsDoneCount, jobsFailedCount, job, success) {
        if (jobsDoneCount + jobsFailedCount == filesAddedToQueueCount) {
            if(!quiet) {
                console.log();
                console.log(clc.green("Successfully instrumented " + scriptWideCounter.files + " file(s)."));
                console.log(clc.yellow("Skipped " + scriptWideCounter.skippedFiles + " file(s) because they were already instrumented or were instrumented files themselves. They can be removed by running in --cleanup mode."));
                console.log(clc.red("Failed instrumenting " + scriptWideCounter.failedFiles + " file(s). Probably because they were no valid JavaScript files." + ((!debug) ? " Run in debug and verbose mode (-d -v or -dv) for more details." : "")));
            }

            q.stop();
            process.exit(0);
        }
    });

    function log(text) {
        if(verbose && !quiet) console.log('info: ' + text);
    }

    function warn(text) {
        if(!quiet) console.warn(clc.yellow(text));
    }

    var fileCount = 0;

    function cleanup(target, separateDir, recursive) {
        function unlinkFile(target, pathTrace, counterObj) {
            if (!common.isInstrumentedFile(target, prefix)) return;

            try {
                fs.unlinkSync(target);
                counterObj.files++;
            } catch (err) {
                log("Could not delete '" + target + "'");
                counterObj.failedFiles++;
            }
        }

        var counter = {
            files: 0,
            failedFiles: 0,
            dirs: 0
        };

        if (separateDir !== "") target = path.join(path.dirname(target), separateDir);

        try {
            var stat = fs.statSync(target);
        } catch(error) {
            console.log('Omitting ' + target);
            return;
        }

        log("Cleaning up '" + target + "'");

        if (stat.isFile()) {
            unlinkFile(target, counter);
            counter.dirs++;
        }
        if (stat.isDirectory()) {
            traverseFileTree(target, recursive, unlinkFile, undefined, counter, "");
        }

        if (!quiet) {
            console.log(clc.green("Deleted " + counter.files + " file(s) in " + counter.dirs + " directory/directories."));
            if (counter.failedFiles > 0 || debug || verbose) {
                console.log(clc.red("Could not delete " + counter.failedFiles + " file(s)."));
            }
        }

        process.exit(0);
    }

    function instrumentSingleFile(target) {
        instrumentFile(target, prefix);
        scriptWideCounter = counter;
    }

    function instrumentFile(target, prefixForFile) {
        filesAddedToQueueCount++;        
        q.addJob({
            file: target, 
            prefix: prefixForFile,
            embedSource: embedSource,
            trace: trace
        });
    }

    function instrumentDir(dir, separateDir, recursive) {
        if (separateDir === "") separateDir = path.basename(dir);

        scriptWideCounter = counter;

        function getSubpath(p) {
            var portions = p.split(path.sep);
            portions.shift();
            return path.join.apply(path, portions);
        }

        function getTargetDir(pathTrace) {
            return path.join(path.dirname(dir), separateDir, getSubpath(pathTrace));
        }

        function fileHandler (file, pathTrace, counterObj) {
            var prefixForFile = path.join(path.relative(path.dirname(file), getTargetDir(pathTrace)), prefix);
            if (prefix === "") prefixForFile += path.sep;
            instrumentFile(file, prefixForFile);
        }

        function dirHandler(pathTrace) {
            var targetDir = getTargetDir(pathTrace);
            
            if(!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir);
            }
        }

        traverseFileTree(dir, recursive, fileHandler, dirHandler, counter, "");
    }

    function traverseFileTree(dir, recursive, fileHandler, dirHandler, counterObj, pathTrace) {
        counterObj.dirs++;

        pathTrace = path.join(pathTrace, path.basename(dir));        
        if (typeof dirHandler === "function") dirHandler(pathTrace);

        filesInDir = fs.readdirSync(dir);
        filesInDir.forEach(function(file) {
            file = path.join(dir, file);
            var stat = fs.statSync(file);
            if(stat.isDirectory() && recursive) {
                traverseFileTree(file, recursive, fileHandler, dirHandler, counterObj, pathTrace);
            }
            if(stat.isFile()) {
                if (typeof fileHandler === "function") fileHandler(file, pathTrace, counterObj);
            }
        });
    }
};
