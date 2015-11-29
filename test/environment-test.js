var assert = require('assert');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  describe('#exec', function() {
    it(':noop', function() {
      var env = new Environment();
      return env.exec(':noop');
    });
  });
});