var expect = require('chai').expect;
var fsMock = require('mock-fs');
var fs = require('fs');
var fileInstrumenter = require('../file-instrumenter');

describe('fileInstrumenter', function() {
    it('should correctly instrument files and persist them with the prefix', function() {
        var code = fs.readFileSync('./test/resources/script.js', 'utf-8');
        var instrumentedCode = fs.readFileSync('./test/resources/instrumented-script.js', 'utf-8');
        fsMock({
            'script.js': code
        });
        fileInstrumenter('script.js', 'instrumented-', function() {});
        var fileContent = fs.readFileSync('instrumented-script.js', 'utf-8');
        expect(fileContent).to.equal(instrumentedCode);
        fsMock.restore();
    });
});
