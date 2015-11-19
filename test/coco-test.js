var assert = require('assert');
var command = require('../js/models/command.js');

describe('command', function() {
  describe('#parseLine', function() {
    it('empty', function() {
      assert.equal(command.parseLine('').length, 0);
      assert.equal(command.parseLine(' ').length, 0);
      assert.equal(command.parseLine(' \t ').length, 0);
    });

    it('comment', function() {
      assert.equal(command.parseLine('#').length, 0);
      assert.equal(command.parseLine('# comment').length, 0);
      assert.equal(command.parseLine(' # comment ').length, 0);
    });

    it('declare', function() {
      var cmd = command.parseLine('x:Module')[0];
      assert(cmd instanceof command.Declare);
      assert.equal(cmd.variableName, 'x');
      assert.equal(cmd.moduleName, 'Module');
    });
  });
});