var assert = require('assert');
var command = require('../js/models/command.js');

describe('command', function() {
  describe('#parseLine', function() {
    it('empty', function() {
      assert.equal(command.parseLine('').length, 0);
      assert.equal(command.parseLine(' ').length, 0);
      assert.equal(command.parseLine(' \t ').length, 0);
    });
  });
});