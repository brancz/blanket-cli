var cP = require('child_process');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

//emits: forkDied(result), allJobsEnded(jobsDoneCount), jobMessage(message, jobsDoneCount)
 
function ForkQueueManager (numForks, modulePath) {
  this.numForks = numForks;
  this.modulePath = modulePath;

  this.jobArgs = [];
  this.currentForksCount = 0;
  this.jobsDoneCount = 0;
  this.running = false;
  this.workIsDone = false;
};

util.inherits(ForkQueueManager, EventEmitter);

ForkQueueManager.prototype.addJob = function (args) {
  this.jobArgs.push(args);
}

ForkQueueManager.prototype.start = function () {
  if (this.running) {
    throw new Error("ForkQueueManager instance has already been started.");
  }

  //this.currentForksCount = 0;
  //this.jobsDoneCount = 0;
  this.running = true;

  for (var i = 0; i < this.numForks; i++) {
    this._launchFork();
  }
};

ForkQueueManager.prototype._getNextArgs = function () {
  return this.jobArgs.shift();
};

ForkQueueManager.prototype._launchFork = function () {
  var self = this;

  if (this.jobArgs.length === 0) {
    return;
  };  

  this.currentForksCount++;

  var fork = cP.fork(this.modulePath);

  fork.on("exit", function (code) {

    self.currentForksCount--;

    if (!self.workIsDone) {
      self.emit("forkDied", code);      
      self._launchFork();
    }
    
    if (self.currentForksCount === 0 && self.jobArgs.length === 0) {
      self.emit("allJobsEnded", self.jobsDoneCount);
    }
  });

  fork.on("message", function (msg) {
    if (msg === "giveMeWork") {
      self._giveForkWork(fork, false);
      return;
    }

    if (msg === "giveMeMoreWork") {
      self._giveForkWork(fork, true)
      return;
    }    

    self.emit("jobMessage", msg, self.jobsDoneCount);
  });
};

ForkQueueManager.prototype._giveForkWork = function (fork, moreWork) {
  var nextArgs = this._getNextArgs();

  if (moreWork) this.jobsDoneCount++;

  if (nextArgs === undefined) {
    this.workIsDone = true;
    fork.kill();
    return;
  }

  fork.send({
    message: "doThisWork",
    args: nextArgs
  });
}

module.exports = ForkQueueManager;