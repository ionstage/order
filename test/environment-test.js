var assert = require('assert');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  describe('#exec', function() {
    it(':noop', function() {
      var env = new Environment();
      return env.exec(':noop');
    });

    it(':declare x Module', function() {
      var env = new Environment();
      var dummy = {};

      env.moduleFactory = function(moduleName) {
        return new Promise(function(resolve) {
          dummy.name = moduleName;
          resolve(dummy);
        });
      };

      return env.exec(':declare x Module').then(function() {
        var v = env.variables[0];
        assert.equal(v.name, 'x');
        assert.equal(v.module, dummy);
        assert.equal(v.module.name, 'Module');
      });
    });
  });
});