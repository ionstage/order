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
        var dummy = {};
        var env = new Environment({
          circuitElementFactory: function(props) {
            assert.equal(props.variableName, 'x');
            assert.equal(props.moduleName, 'Module');
            return new Promise(function(resolve) {
              resolve(dummy);
            });
          }
        });

        return env.exec(p).then(function() {
          var v = env.variables[0];
          assert.equal(v.name, 'x');
          assert.equal(v.module.name, 'Module');
          assert.equal(v.module.circuitElement, dummy);
        });
      });
    });
  });
});