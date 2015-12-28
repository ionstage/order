var assert = require('assert');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  var defaultProps = {
    circuitElementFactory: function() { return {}; }
  };

  describe('#exec', function() {
    it('accept empty command', function() {
      var env = new Environment(defaultProps);
      return env.exec('').then(function(cmd) {
        assert.equal(cmd.name, 'noop');
      });
    });

    it('create new variable', function() {
      var dummy = {};
      var env = new Environment({
        circuitElementFactory: function(props) {
          assert.equal(props.variableName, 'x');
          assert.equal(props.moduleName, 'Module');
          return Promise.resolve(dummy);
        }
      });

      return env.exec(':new x Module').then(function(cmd) {
        var v = env.variables[0];
        assert.equal(cmd.name, 'new');
        assert.equal(v.name, cmd.variableName);
        assert.equal(v.circuitElement, dummy);
      });
    });

    it('should not create variables with the same name', function(done) {
      var env = new Environment(defaultProps);

      return env.exec(':new x Module').then(function() {
        return env.exec(':new x Module');
      }).catch(function(e) {
        assert(e instanceof Error);
        done();
      });
    });

    it('should not set circuit element to null', function(done) {
      var env = new Environment({
        circuitElementFactory: function() { return null; }
      });

      return env.exec(':new x Module').catch(function(e) {
        assert(e instanceof Error);
        done();
      });
    });
  });
});