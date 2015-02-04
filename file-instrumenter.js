Error.stackTraceLimit = Infinity;

var fs = require('fs');
var path = require('path');
var common = require(path.join(__dirname, "instrumenter-common.js"));

module.exports = function(target, prefix, embedSource, trace, sendCallback) { //sendCallback is needed for testing via dependency injection
    var blkt = require('blanket')({
        'data-cover-customVariable': 'window._$blanket',
        'data-cover-flags': {
            trace: trace,
            embedSource: embedSource
        }
    });    

    function blanketInitializer(target, fileContent, done) {
        blkt.instrument({
            inputFile: fileContent,
            inputFileName: path.basename(target)
        }, done);
    }

    function send(msg) {
        sendCallback = sendCallback || process.send.bind(process);

        sendCallback(msg);
    }

    if (common.isAlreadyInstrumentedFile(target, prefix) || common.isInstrumentedFile(target, prefix)) {
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
        blanketInitializer(target, fileContent, function(instrumentedCode) {
            dir = path.dirname(target);
            newFileName = prefix + path.basename(target);
       
            fs.writeFileSync(path.join(dir, newFileName), instrumentedCode);
            var endTime = process.hrtime(startTime);

            send({
                state: "success",
                file: target,
                duration: endTime
            });
        });
    } catch (err) {
        send({
            state: "failure",
            file: target,
            error: err.toString()
        });
    }
};
