var assert = require('assert');
var CircuitElement = require('../js/models/circuit-element.js');

describe('CircuitElement', function() {
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
});