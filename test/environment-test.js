var assert = require('assert');
var sinon = require('sinon');
var CircuitModule = require('../js/models/circuit-module.js');
var Environment = require('../js/models/environment.js');

describe('environment', function() {
  var defaultProps = {
    circuitModuleLoader: function() { return Promise.resolve(new CircuitModule.OrderModule([])); },
    circuitModuleUnloader: function() { return Promise.resolve(); },
    scriptLoader: function() { /* do nothing */ },
    scriptSaver: function() { /* do nothing */ },
  };

  describe('#exec', function() {
    it('accept empty command', function() {
      var env = new Environment(defaultProps);
      return env.exec('');
    });

    it('create new variable', function() {
      var dummy = {};
      var env = new Environment({
        circuitModuleLoader: function(variableName, moduleName) {
          assert.equal(variableName, 'x');
          assert.equal(moduleName, 'Module');
          return Promise.resolve(dummy);
        },
      });

      return env.exec(':new x Module').then(function() {
        var v = env.variableTable.x;
        assert.equal(v.name, 'x');
        assert.equal(v.moduleName, 'Module');
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
        circuitModuleLoader: function() { return null; },
      });

      return env.exec(':new x Module').catch(function(e) {
        assert(e instanceof Error);
        done();
      });
    });

    it('bind circuit module members', function() {
      var cels = [];
      var env = new Environment({
        circuitModuleLoader: function() {
          var cel = new CircuitModule.OrderModule([
            { name: 'member0', type: 'prop' },
            { name: 'member1', type: 'prop' },
          ]);
          cels.push(cel);
          return Promise.resolve(cel);
        },
      });

      CircuitModule.bind = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':new y Module');
      }).then(function() {
        return env.exec(':bind x.member0 y.member1');
      }).then(function() {
        var member0 = cels[0].get('member0');
        var member1 = cels[1].get('member1');
        assert(CircuitModule.bind.calledWith(member0, member1));
        assert.equal(env.bindings.length, 1);
      });
    });

    it('unbind circuit module members', function() {
      var cels = [];
      var env = new Environment({
        circuitModuleLoader: function() {
          var cel = new CircuitModule.OrderModule([
            { name: 'member0', type: 'prop' },
            { name: 'member1', type: 'prop' },
          ]);
          cels.push(cel);
          return Promise.resolve(cel);
        },
      });

      CircuitModule.unbind = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':new y Module');
      }).then(function() {
        return env.exec(':bind x.member0 y.member1');
      }).then(function() {
        return env.exec(':unbind x.member0 y.member1');
      }).then(function() {
        var member0 = cels[0].get('member0');
        var member1 = cels[1].get('member1');
        assert(CircuitModule.unbind.calledWith(member0, member1));
        assert.equal(env.bindings.length, 0);
      });
    });

    it('send data to a member of circuit module', function() {
      var env = new Environment({
        circuitModuleLoader: function() {
          return Promise.resolve(new CircuitModule.OrderModule([
            { name: 'prop', type: 'prop' },
          ]));
        },
      });

      return env.exec(':new x Module').then(function() {
        return env.exec(':send x.prop data_text');
      }).then(function() {
        var member = env.variableTable.x.circuitModule.get('prop');
        assert.equal(member(), 'data_text');
      });
    });

    it('delete variable', function() {
      var env = new Environment(defaultProps);

      env.circuitModuleUnloader = sinon.spy(env.circuitModuleUnloader);

      return env.exec(':new x Module').then(function() {
        return env.exec(':delete x');
      }).then(function() {
        assert.equal(Object.keys(env.variableTable).length, 0);
        assert(env.circuitModuleUnloader.calledOnce);
      });
    });

    it('reset', function() {
      var env = new Environment(defaultProps);

      env.circuitModuleUnloader = sinon.spy(env.circuitModuleUnloader);

      return env.exec(':new x Module').then(function() {
        return env.exec(':new y Module');
      }).then(function() {
        return env.exec(':reset');
      }).then(function() {
        assert.equal(Object.keys(env.variableTable).length, 0);
        assert(env.circuitModuleUnloader.calledTwice);
      });
    });

    it('load command', function() {
      var env = new Environment(defaultProps);

      env.scriptLoader = sinon.spy(function() {
        return Promise.resolve({ text: ':new x Module', fileName: 'test.os' });
      });

      return env.exec(':load /path/to/script').then(function() {
        assert(env.scriptLoader.calledWith('/path/to/script'));
        assert(env.variableTable.hasOwnProperty('x'));
      });
    });

    it('save command', function() {
      var env = new Environment(defaultProps);

      env.scriptSaver = sinon.spy();

      return env.exec(':new x Module').then(function() {
        return env.exec(':save /path/to/script');
      }).then(function() {
        assert(env.scriptSaver.calledWith('/path/to/script', 'x:Module\n'));
      });
    });
  });

  it('#unbind all circuit module members on deleting variable', function() {
    var env = new Environment({
      circuitModuleLoader: function(variableName, moduleName) {
        switch (variableName) {
          case 'x':
            return Promise.resolve(new CircuitModule.OrderModule([{ name: 'a', type: 'prop' }, { name: 'b', type: 'prop' }]));
          case 'y':
            return Promise.resolve(new CircuitModule.OrderModule([{ name: 'a', type: 'prop' }, { name: 'b', type: 'prop' }]));
          case 'z':
            return Promise.resolve(new CircuitModule.OrderModule([{ name: 'a', type: 'prop' }, { name: 'b', type: 'prop' }]));
        }
      },
      circuitModuleUnloader: function() { return Promise.resolve(); },
    });

    var x, y, z;
    CircuitModule.unbind = sinon.spy();

    return Promise.all([
      env.exec(':new x Module'),
      env.exec(':new y Module'),
      env.exec(':new z Module'),
    ]).then(function() {
      return Promise.all([
        env.exec(':bind x.a y.a'),
        env.exec(':bind x.b y.a'),
        env.exec(':bind y.a z.a'),
        env.exec(':bind y.a z.b'),
        env.exec(':bind x.b y.b'),
        env.exec(':bind y.b z.b'),
      ]);
    }).then(function() {
      x = env.variableTable['x'];
      y = env.variableTable['y'];
      z = env.variableTable['z'];
      return env.exec(':delete y');
    }).then(function() {
      var args = CircuitModule.unbind.args;
      assert.equal(args[0][0], x.circuitModule.get('a'));
      assert.equal(args[0][1], y.circuitModule.get('a'));
      assert.equal(args[1][0], x.circuitModule.get('b'));
      assert.equal(args[1][1], y.circuitModule.get('a'));
      assert.equal(args[2][0], y.circuitModule.get('a'));
      assert.equal(args[2][1], z.circuitModule.get('a'));
      assert.equal(args[3][0], y.circuitModule.get('a'));
      assert.equal(args[3][1], z.circuitModule.get('b'));
      assert.equal(args[4][0], x.circuitModule.get('b'));
      assert.equal(args[4][1], y.circuitModule.get('b'));
      assert.equal(args[5][0], y.circuitModule.get('b'));
      assert.equal(args[5][1], z.circuitModule.get('b'));
    });
  });
});
