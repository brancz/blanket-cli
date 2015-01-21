Error.stackTraceLimit = Infinity;

// if (require.main === module) {
//     console.log("This is just a module used by the main script. please call 'node cli' instead.");
//     process.exit(1);
// }
var fs = require('fs');
var path = require('path');
var blkt = require('blanket')({
    'data-cover-customVariable': 'window._$blanket'
});

var verbose = (process.argv[3] == "true");
var quiet = (process.argv[4] == "true");
var prefix = process.argv[5];

instrumentFile(process.argv[2]);

function blanketInitializer(target, fileContent, done) {
    blkt.instrument({
        inputFile: fileContent,
        inputFileName: path.basename(target)
    }, done);
}

function send(msg) {
    process.send(msg);
}

function isInstrumentedFile(target) {
    return (path.basename(target).indexOf(prefix) == 0); 
}

function isAlreadyInstrumentedFile(target) {
    return (fs.existsSync(path.join(path.dirname(target), prefix + path.basename(target)))); 
}

function instrumentFile(target) {
    if (isAlreadyInstrumentedFile(target) || isInstrumentedFile(target)) {
        send({
            state: "skipped",
            file: target
        });
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

                    send({
                        state: "success",
                        file: target,
                        duration: endTime
                    });
                } catch (err) {
                    send({
                        state: "failure",
                        file: target,
                        error: err
                    });
                }
            });
        } catch (err) {
            send({
                state: "failure",
                file: target,
                error: err
            });
        }
    } catch (err) {
        send({
            state: "failure",
            file: target,
            error: err
        });
    }
}
