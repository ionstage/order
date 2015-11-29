var assert = require('assert');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  describe('#exec', function() {
    it(':noop', function(done) {
      var env = new Environment();
      env.exec(':noop').then(done);
    });
  });
});