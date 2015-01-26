var path = require('path');
var fs = require('fs');

module.exports = {
  isInstrumentedFile: isInstrumentedFile,
  isAlreadyInstrumentedFile: isAlreadyInstrumentedFile
};

function isAlreadyInstrumentedFile(target, prefix) {
    return (fs.existsSync(path.join(path.dirname(target), prefix + path.basename(target)))); 
}

function isInstrumentedFile(target, prefix) {
    return (path.basename(target).indexOf(path.basename(prefix)) == 0); 
}
