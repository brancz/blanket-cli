console.log("Child " + process.argv[2] + " launched!");

process.on("message", function (msg, obj) {
	console.log(msg);
	obj.counter++;
});

setTimeout(function () {
  process.exit(0);
}, 4000);

process.on('exit', function(code) {
  console.log("Child " + process.argv[2] + "closed");
});