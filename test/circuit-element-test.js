var assert = require('assert');
var sinon = require('sinon');
var CircuitElement = require('../js/models/circuit-element.js');

describe('CircuitElement', function() {
  it('create empty element', function() {
    var cel = CircuitElement.empty();
    assert.equal(Object.keys(cel.memberMap).length, 0);
  });

  it('has members with only name', function() {
    var cel = new CircuitElement([
      'prop',
      'onevent'
    ]);

    var prop = cel.get('prop');
    var onevent = cel.get('onevent');

    assert.equal(typeof prop(), 'undefined');
    assert.equal(typeof onevent(), 'undefined');
    assert.strictEqual(cel.get('event'), null);
  });

  it('has prop members with name and value', function() {
    var cel = new CircuitElement([
      ['prop', 1]
    ]);

    var prop = cel.get('prop');

    assert.equal(prop(), 1);
    prop(2);
    assert.equal(prop(), 2);
  });

  it('has event members with name and listener', function() {
    var listener = sinon.spy();
    var cel = new CircuitElement([
      ['onevent', listener]
    ]);

    var onevent = cel.get('onevent');

    onevent();
    assert(listener.calledOnce);
  });

  it('should make the latter member definition a priority', function() {
    var listener0 = sinon.spy();
    var listener1 = sinon.spy();
    var cel = new CircuitElement([
      ['prop', 1],
      ['onevent', listener0],
      ['prop', 2],
      ['onevent', listener1]
    ]);

    var prop = cel.get('prop');
    var onevent = cel.get('onevent');

    assert.equal(prop(), 2);
    onevent();
    assert(listener0.notCalled);
    assert(listener1.calledOnce);
  });
});