var assert = require('assert');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  describe('#exec', function() {
    it(':noop', function() {
      var env = new Environment();
      return env.exec(':noop');
    });

    [
      ':new x Module',
      'x:Module'
    ].forEach(function(p) {
      it(p, function() {
        var env = new Environment();

        env.moduleFactory = function(moduleName) {
          return new Promise(function(resolve) {
            resolve({
              name: moduleName
            });
          });
        };

        return env.exec(p).then(function() {
          var v = env.variables[0];
          assert.equal(v.name, 'x');
          assert.equal(v.module.name, 'Module');
        });
      });
    });
  });
});