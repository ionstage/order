var assert = require('assert');
var sinon = require('sinon');
var CircuitElement = require('../js/models/circuit-element.js');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  var defaultProps = {
    circuitElementFactory: function() { return CircuitElement.empty(); },
    circuitElementDisposal: function() { /* do nothing */ },
    scriptLoader: function() { /* do nothing */ }
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
        var v = env.variableTable.fetch(cmd.variableName);
        assert.equal(cmd.name, 'new');
        assert.equal(v.name, cmd.variableName);
        assert.equal(v.moduleName, cmd.moduleName);
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

    it('bind circuit element members', function() {
      var cels = [];
      var env = new Environment({
        circuitElementFactory: function() {
          var cel = new CircuitElement([
            { name: 'member0' },
            { name: 'member1' }
          ]);
          cels.push(cel);
          return cel;
        }
      });

      CircuitElement.bind = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':new y Module');
      }).then(function() {
        return env.exec(':bind x.member0 y.member1');
      }).then(function(cmd) {
        var member0 = cels[0].get(cmd.sourceMemberName);
        var member1 = cels[1].get(cmd.targetMemberName);
        assert.equal(cmd.name, 'bind');
        assert(CircuitElement.bind.calledWith(member0, member1));
      });
    });

    it('unbind circuit element members', function() {
      var cels = [];
      var env = new Environment({
        circuitElementFactory: function() {
          var cel = new CircuitElement([
            { name: 'member0' },
            { name: 'member1' }
          ]);
          cels.push(cel);
          return cel;
        }
      });

      CircuitElement.unbind = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':new y Module');
      }).then(function() {
        return env.exec(':bind x.member0 y.member1');
      }).then(function() {
        return env.exec(':unbind x.member0 y.member1');
      }).then(function(cmd) {
        var member0 = cels[0].get(cmd.sourceMemberName);
        var member1 = cels[1].get(cmd.targetMemberName);
        assert.equal(cmd.name, 'unbind');
        assert(CircuitElement.unbind.calledWith(member0, member1));
      });
    });

    it('send data to a member of circuit element', function() {
      var env = new Environment({
        circuitElementFactory: function() {
          return new CircuitElement([
            { name: 'prop' }
          ]);
        }
      });

      return env.exec(':new x Module').then(function() {
        return env.exec(':send x.prop data_text');
      }).then(function(cmd) {
        var member = env.variableTable.fetch(cmd.variableName).circuitElement.get(cmd.memberName);
        assert.equal(cmd.name, 'send');
        assert.equal(member(), 'data_text');
      });
    });

    it('delete variable', function() {
      var env = new Environment(defaultProps);

      env.circuitElementDisposal = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':delete x');
      }).then(function(cmd) {
        assert.equal(cmd.name, 'delete');
        assert.equal(env.variableTable.names.length, 0);
        assert(env.circuitElementDisposal.calledOnce);
      });
    });

    it('reset', function() {
      var env = new Environment(defaultProps);

      env.circuitElementDisposal = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':new y Module');
      }).then(function() {
        return env.exec(':reset');
      }).then(function(cmd) {
        assert.equal(cmd.name, 'reset');
        assert.equal(env.variableTable.names.length, 0);
        assert(env.circuitElementDisposal.calledTwice);
      });
    });

    it('load command', function() {
      var env = new Environment(defaultProps);

      env.scriptLoader = sinon.spy(function() {
        return ':new x Module';
      });

      return env.exec(':load /path/to/script').then(function(cmd) {
        assert.equal(cmd.name, 'load');
        assert(env.scriptLoader.calledWith(cmd.filePath));
        assert(env.variableTable.has('x'));
      });
    });

    it('save command', function() {
      var env = new Environment(defaultProps);
      return env.exec(':save /path/to/script').then(function(cmd) {
        assert.equal(cmd.name, 'save');
        assert.equal(cmd.filePath, '/path/to/script');
      });
    });
  });
});