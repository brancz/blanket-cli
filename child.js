console.log("Child " + process.argv[2] + " launched!");

process.on("message", function(msg, target, counterObj) {
    if (msg === "instrumentFile") {
        instrumentFile(target, counterObj);
    }
});

setTimeout(function () {
  process.exit(0);
}, 4000);

process.on('exit', function(code) {
  console.log("Child " + process.argv[2] + "closed");
});