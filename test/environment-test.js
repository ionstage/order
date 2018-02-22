var assert = require('assert');
var sinon = require('sinon');
var CircuitModule = require('../js/models/circuit-module.js');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  var defaultProps = {
    circuitModuleFactory: function() { return new CircuitModule([]); },
    circuitModuleDisposal: function() { /* do nothing */ },
    scriptLoader: function() { /* do nothing */ },
    scriptSaver: function() { /* do nothing */ },
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
        circuitModuleFactory: function(props) {
          assert.equal(props.variableName, 'x');
          assert.equal(props.moduleName, 'Module');
          return Promise.resolve(dummy);
        },
      });

      return env.exec(':new x Module').then(function(cmd) {
        var v = env.variableTable.fetch(cmd.variableName);
        assert.equal(cmd.name, 'new');
        assert.equal(v.name, cmd.variableName);
        assert.equal(v.moduleName, cmd.moduleName);
        assert.equal(v.circuitModule, dummy);
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

    it('should not set circuit module to null', function(done) {
      var env = new Environment({
        circuitModuleFactory: function() { return null; },
      });

      return env.exec(':new x Module').catch(function(e) {
        assert(e instanceof Error);
        done();
      });
    });

    it('bind circuit module members', function() {
      var cels = [];
      var env = new Environment({
        circuitModuleFactory: function() {
          var cel = new CircuitModule([
            { name: 'member0', type: 'prop' },
            { name: 'member1', type: 'prop' },
          ]);
          cels.push(cel);
          return cel;
        },
      });

      CircuitModule.bind = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':new y Module');
      }).then(function() {
        return env.exec(':bind x.member0 y.member1');
      }).then(function(cmd) {
        var member0 = cels[0].get(cmd.sourceMemberName);
        var member1 = cels[1].get(cmd.targetMemberName);
        assert.equal(cmd.name, 'bind');
        assert(CircuitModule.bind.calledWith(member0, member1));
        assert.equal(env.bindingList.data.length, 1);
      });
    });

    it('unbind circuit module members', function() {
      var cels = [];
      var env = new Environment({
        circuitModuleFactory: function() {
          var cel = new CircuitModule([
            { name: 'member0', type: 'prop' },
            { name: 'member1', type: 'prop' },
          ]);
          cels.push(cel);
          return cel;
        },
      });

      CircuitModule.unbind = sinon.spy();

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
        assert(CircuitModule.unbind.calledWith(member0, member1));
        assert.equal(env.bindingList.data.length, 0);
      });
    });

    it('send data to a member of circuit module', function() {
      var env = new Environment({
        circuitModuleFactory: function() {
          return new CircuitModule([
            { name: 'prop', type: 'prop' },
          ]);
        },
      });

      return env.exec(':new x Module').then(function() {
        return env.exec(':send x.prop data_text');
      }).then(function(cmd) {
        var member = env.variableTable.fetch(cmd.variableName).circuitModule.get(cmd.memberName);
        assert.equal(cmd.name, 'send');
        assert.equal(member(), 'data_text');
      });
    });

    it('delete variable', function() {
      var env = new Environment(defaultProps);

      env.circuitModuleDisposal = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':delete x');
      }).then(function(cmd) {
        assert.equal(cmd.name, 'delete');
        assert.equal(env.variableTable.variables().length, 0);
        assert(env.circuitModuleDisposal.calledOnce);
      });
    });

    it('reset', function() {
      var env = new Environment(defaultProps);

      env.circuitModuleDisposal = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':new y Module');
      }).then(function() {
        return env.exec(':reset');
      }).then(function(cmd) {
        assert.equal(cmd.name, 'reset');
        assert.equal(env.variableTable.variables().length, 0);
        assert(env.circuitModuleDisposal.calledTwice);
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

      env.scriptSaver = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':save /path/to/script');
      }).then(function(cmd) {
        assert.equal(cmd.name, 'save');
        assert(env.scriptSaver.calledWith(cmd.filePath, 'x:Module\n'));
      });
    });
  });
});
