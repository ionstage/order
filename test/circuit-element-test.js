var assert = require('assert');
var CircuitElement = require('../js/models/circuit-element.js');

describe('CircuitElement', function() {
  it('has members with only name', function() {
    var cel = new CircuitElement([
      'prop',
      'onevent'
    ]);

    assert.equal(typeof cel.get('prop'), 'function');
    assert.equal(typeof cel.get('onevent'), 'function');
    assert.strictEqual(cel.get('event'), null);
  });
});