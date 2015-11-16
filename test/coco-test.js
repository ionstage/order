var assert = require('assert');
var command = require('../js/models/command.js');

describe('command', function() {
  describe('#parseLine', function() {
    it('empty', function() {
      var list = command.parseLine('');
      assert.equal(list.length, 0);
    });
  });
});