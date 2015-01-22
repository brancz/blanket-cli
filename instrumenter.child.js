Error.stackTraceLimit = Infinity;

var fs = require('fs');
var path = require('path');
var common = require(path.join(__dirname, "instrumenter.common.js"));
var blkt = require('blanket')({
    'data-cover-customVariable': 'window._$blanket'
});

process.on("message", function (msg) {
    if (msg.message === "doThisWork") {
        instrumentFile(msg.args.file, msg.args.prefix);

        if (Math.random()

        process.send("giveMeMoreWork");
    }
});

process.send("giveMeWork");

function blanketInitializer(target, fileContent, done) {
    blkt.instrument({
        inputFile: fileContent,
        inputFileName: path.basename(target)
    }, done);
}

function send(msg) {
    process.send(msg);
}

function instrumentFile(target, prefix) {
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
}
