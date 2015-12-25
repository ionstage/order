var assert = require('assert');
var circuit = require('circuit');
var sinon = require('sinon');
var CircuitElement = require('../js/models/circuit-element.js');

describe('CircuitElement', function() {
  it('create empty element', function() {
    var cel = CircuitElement.empty();
    assert.equal(Object.keys(cel.memberMap).length, 0);
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

  it('bind members', function() {
    var cel0 = new CircuitElement([
      { name: 'prop' }
    ]);
    var cel1 = new CircuitElement([
      { name: 'prop' }
    ]);

    var prop0 = cel0.get('prop');
    var prop1 = cel1.get('prop');

    circuit.bind = sinon.spy();

    CircuitElement.bind(prop0, prop1);

    var callee0 = cel0.memberMap['prop'].callee;
    var callee1 = cel1.memberMap['prop'].callee;

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

    circuit.unbind = sinon.spy();

    CircuitElement.unbind(prop0, prop1);

    var callee0 = cel0.memberMap['prop'].callee;
    var callee1 = cel1.memberMap['prop'].callee;

    assert(circuit.unbind.calledWith(callee0, callee1));
  });
});