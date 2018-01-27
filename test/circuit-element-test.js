var assert = require('assert');
var circuit = require('circuit');
var sinon = require('sinon');
var CircuitElement = require('../js/models/circuit-element.js');

describe('CircuitElement', function() {
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

  it('create empty element', function() {
    var cel = CircuitElement.empty();
    assert.equal(Object.keys(cel.memberTable).length, 0);
  });

  it('has members with only name', function() {
    var cel = new CircuitElement([
      { name: 'prop' },
      { name: 'onevent' }
    ]);

    var prop = cel.get('prop');
    var onevent = cel.get('onevent');

    assert.equal(typeof prop(), 'undefined');
    assert.equal(typeof onevent(), 'undefined');
    assert.strictEqual(cel.get('event'), null);
  });

  it('has prop members with name and value', function() {
    var cel = new CircuitElement([
      { name: 'prop', arg: 1 }
    ]);

    var prop = cel.get('prop');

    assert.equal(prop(), 1);
    prop(2);
    assert.equal(prop(), 2);
  });

  it('has event members with name and listener', function() {
    var listener = sinon.spy();
    var cel = new CircuitElement([
      { name: 'onevent', arg: listener }
    ]);

    var onevent = cel.get('onevent');

    onevent();
    assert(listener.calledOnce);
  });

  it('has members with type setting', function() {
    var arg = {};
    var listener = function() {};
    var cel = new CircuitElement([
      { name: 'onprop', arg: arg, type: 'prop' },
      { name: 'event', arg: listener, type: 'event' }
    ]);

    assert(circuit.prop.calledWith(arg));
    assert(circuit.event.calledWith(listener));
  });

  it('should make the latter member definition a priority', function() {
    var listener0 = sinon.spy();
    var listener1 = sinon.spy();
    var cel = new CircuitElement([
      { name: 'prop', arg: 1 },
      { name: 'onevent', arg: listener0 },
      { name: 'prop', arg: 2 },
      { name: 'onevent', arg: listener1 }
    ]);

    var prop = cel.get('prop');
    var onevent = cel.get('onevent');

    assert.equal(prop(), 2);
    onevent();
    assert(listener0.notCalled);
    assert(listener1.calledOnce);
  });

  it('get all members', function() {
    var cel = new CircuitElement([
      { name: 'prop' },
      { name: 'onevent' }
    ]);

    var members = cel.getAll();

    assert.equal(members[0], cel.get('prop'));
    assert.equal(members[1], cel.get('onevent'));
  });

  it('bind members', function() {
    var cel0 = new CircuitElement([
      { name: 'prop' }
    ]);
    var cel1 = new CircuitElement([
      { name: 'prop' }
    ]);

    var prop0 = cel0.get('prop');
    var prop1 = cel1.get('prop');

    CircuitElement.bind(prop0, prop1);

    var callee0 = cel0.memberTable['prop'].callee;
    var callee1 = cel1.memberTable['prop'].callee;

    assert(circuit.bind.calledWith(callee0, callee1));
  });

  it('unbind members', function() {
    var cel0 = new CircuitElement([
      { name: 'prop' }
    ]);
    var cel1 = new CircuitElement([
      { name: 'prop' }
    ]);

    var prop0 = cel0.get('prop');
    var prop1 = cel1.get('prop');

    CircuitElement.bind(prop0, prop1);
    CircuitElement.unbind(prop0, prop1);

    var callee0 = cel0.memberTable['prop'].callee;
    var callee1 = cel1.memberTable['prop'].callee;

    assert(circuit.unbind.calledWith(callee0, callee1));
  });

  it('unbind all members', function() {
    var cel0 = new CircuitElement([
      { name: 'prop' }
    ]);
    var cel1 = new CircuitElement([
      { name: 'prop' }
    ]);
    var cel2 = new CircuitElement([
      { name: 'prop' }
    ]);

    var prop0 = cel0.get('prop');
    var prop1 = cel1.get('prop');
    var prop2 = cel2.get('prop');

    CircuitElement.bind(prop1, prop0);
    CircuitElement.bind(prop0, prop2);
    CircuitElement.unbindAll(prop0);

    var callee0 = cel0.memberTable['prop'].callee;
    var callee1 = cel1.memberTable['prop'].callee;
    var callee2 = cel2.memberTable['prop'].callee;

    assert(circuit.unbind.firstCall.calledWith(callee1, callee0));
    assert(circuit.unbind.secondCall.calledWith(callee0, callee2));
  });
});
