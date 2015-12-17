var assert = require('assert');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  describe('#exec', function() {
    it(':noop', function() {
      var env = new Environment();
      return env.exec(':noop').then(function(cmd) {
        assert.equal(cmd.name, 'noop');
      });
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
            return Promise.resolve(dummy);
          }
        });

        return env.exec(p).then(function(cmd) {
          var v = env.variables[0];
          assert.equal(cmd.name, 'new');
          assert.equal(v.name, cmd.variableName);
          assert.equal(v.circuitElement, dummy);
        });
      });
    });

    it('should not create variables with the same name', function(done) {
      var env = new Environment({
        circuitElementFactory: function() { return {}; }
      });

      return env.exec(':new x Module').then(function() {
        return env.exec(':new x Module');
      }).catch(function(e) {
        assert(e instanceof Error);
        done();
      });
    });
  });
});