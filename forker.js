var childProcess = require('child_process');

var i = 0;
while (i < 10) {
  var fork = childProcess.fork('child.js', [i])
  fork.send("test");
  i++;
}

process.on('exit', function(code) {
  console.log("Parent closed");
});