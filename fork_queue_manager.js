var cP = require('child_process');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

//emits: jobEnded(result, jobsDoneCount), allJobsEnded(jobsDoneCount), jobMessage(message, jobsDoneCount)
 
function ForkQueueManager (numForks, modulePath) {
  this.numForks = numForks;
  this.modulePath = modulePath;
  this.jobArgs = [];
  this.currentForksCount = 0;
  this.jobsDoneCount = 0;
  this.running = false;
};

util.inherits(ForkQueueManager, EventEmitter);

ForkQueueManager.prototype.addJob = function (args) {
  this.jobArgs.push(args);

  if (this.currentForksCount + 1 < this.numForks) {
    this._launchFork();
  }
}

ForkQueueManager.prototype.start = function () {
  if (this.running) {
    throw new Error("ForkQueueManager instance has already been started.");
  }

  for (var i = 0; i < this.numForks; i++) {
    this._launchFork();
  }
};

ForkQueueManager.prototype._getNextArgs = function () {
  return this.jobArgs.shift();
};

ForkQueueManager.prototype._launchFork = function () {
  var self = this;

  var args = this._getNextArgs();
  
  if (args === undefined) {
    self.emit("allJobsEnded");
  };

  this.currentForksCount++;

  var fork = cP.fork(this.modulePath, args);

  fork.on("exit", function (code) {
    self.currentForksCount--;
    self.jobsDoneCount++;    
    self.emit("jobEnded", code, self.jobsDoneCount);
    self._launchFork();
  });

  fork.on("message", function (msg) {
    self.emit("jobMessage", msg, self.jobsDoneCount);
  });
};

module.exports = ForkQueueManager;