var assert = require('assert');
var circuit = require('circuit');
var sinon = require('sinon');
var CircuitModule = require('../js/models/circuit-module.js');

describe('CircuitModule.OrderModule', function() {
  beforeEach(function() {
    Object.keys(circuit).forEach(function(key) {
      sinon.spy(circuit, key);
    });
  });

  afterEach(function() {
    Object.keys(circuit).forEach(function(key) {
      circuit[key].restore();
    });
  });

  it('has members with only name', function() {
    var cel = new CircuitModule.OrderModule([
      { name: 'prop', type: 'prop' },
      { name: 'onevent', type: 'event' },
    ]);

    var prop = cel.get('prop');
    var onevent = cel.get('onevent');

    assert.equal(typeof prop(), 'undefined');
    assert.equal(typeof onevent(), 'undefined');
    assert.strictEqual(cel.get('event'), null);
  });

  it('has prop members with name and value', function() {
    var cel = new CircuitModule.OrderModule([
      { name: 'prop', type: 'prop', arg: 1 },
    ]);

    var prop = cel.get('prop');

    assert.equal(prop(), 1);
    prop(2);
    assert.equal(prop(), 2);
  });

  it('has event members with name and listener', function() {
    var listener = sinon.spy();
    var cel = new CircuitModule.OrderModule([
      { name: 'onevent', type: 'event', arg: listener },
    ]);

    var onevent = cel.get('onevent');

    onevent();
    assert(listener.calledOnce);
  });

  it('has members with type setting', function() {
    var arg = {};
    var listener = function() {};
    var cel = new CircuitModule.OrderModule([
      { name: 'onprop', arg: arg, type: 'prop' },
      { name: 'event', arg: listener, type: 'event' },
    ]);

    assert(circuit.prop.calledWith(arg));
    assert(circuit.event.calledWith(listener));
  });

  it('should make the latter member definition a priority', function() {
    var listener0 = sinon.spy();
    var listener1 = sinon.spy();
    var cel = new CircuitModule.OrderModule([
      { name: 'prop', type: 'prop', arg: 1 },
      { name: 'onevent', type: 'event', arg: listener0 },
      { name: 'prop', type: 'prop', arg: 2 },
      { name: 'onevent', type: 'event', arg: listener1 },
    ]);

    var prop = cel.get('prop');
    var onevent = cel.get('onevent');

    assert.equal(prop(), 2);
    onevent();
    assert(listener0.notCalled);
    assert(listener1.calledOnce);
  });

  it('bind members', function() {
    var cel0 = new CircuitModule.OrderModule([
      { name: 'prop', type: 'prop' },
    ]);
    var cel1 = new CircuitModule.OrderModule([
      { name: 'prop', type: 'prop' },
    ]);

    var prop0 = cel0.get('prop');
    var prop1 = cel1.get('prop');

    CircuitModule.bind(prop0, prop1);
    prop0(0);
    assert.equal(prop1(), 0);
  });

  it('unbind members', function() {
    var cel0 = new CircuitModule.OrderModule([
      { name: 'prop', type: 'prop' },
    ]);
    var cel1 = new CircuitModule.OrderModule([
      { name: 'prop', type: 'prop' },
    ]);

    var prop0 = cel0.get('prop');
    var prop1 = cel1.get('prop');

    CircuitModule.bind(prop0, prop1);
    prop0(0);
    CircuitModule.unbind(prop0, prop1);
    prop0(1);
    assert.equal(prop1(), 0);
  });
});
