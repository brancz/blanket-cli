Error.stackTraceLimit = Infinity;

// if (require.main === module) {
//     console.log("This is just a module used by the main script. please call 'node cli' instead.");
//     process.exit(1);
// }

var fs = require('fs');
var path = require('path');
var clc = require('cli-color');
var blkt = require('blanket')({
    'data-cover-customVariable': 'window._$blanket'
});

process.on("message", function(msg, target, counterObj) {
    if (msg === "instrumentFile") {
        instrumentFile(target, counterObj);
    }
});

function blanketInitializer(target, fileContent, done) {
    blkt.instrument({
        inputFile: fileContent,
        inputFileName: path.basename(target)
    }, done);
}

function isInstrumentedFile(target) {
    return (path.basename(target).indexOf(prefix) == 0); 
}

function isAlreadyInstrumentedFile(target) {
    return (fs.existsSync(path.join(path.dirname(target), prefix + path.basename(target)))); 
}

function instrumentFile(target, counterObj) {
    if (isAlreadyInstrumentedFile(target) || isInstrumentedFile(target)) {
        counterObj.skippedFiles++;
        return;
    }

    var startTime = process.hrtime();
    blkt.restoreBlanketLoader();
    try {
        fileContent = fs.readFileSync(target, 'utf-8');
        try {
            blanketInitializer(target, fileContent, function(instrumentedCode) {
                dir = path.dirname(target);
                newFileName = prefix + path.basename(target);
                try {
                    fs.writeFileSync(path.join(dir, newFileName), instrumentedCode);
                    var endTime = process.hrtime(startTime);
                    counterObj.files++;

                    log('Successfully instrumented ' + target + " in " + endTime[0] + "s " + endTime[1] + "ns");
                    log("Already instrumented " + counterObj.files + " file(s) in " + counterObj.dirs + " directory/directories");
                } catch (err) {
                    warn(err);
                    counterObj.failedFiles++;
                }
            });
        } catch (err) {
            warn(clc.red("Cannot instrument '" + target + "': " + err));
            counterObj.failedFiles++;
        }
    } catch (err) {
        warn(err);
        counterObj.failedFiles++;
    }
}
