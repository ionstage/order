(function(app) {
  'use strict';

  var circuit = require('circuit');

  var CircuitProp = function(props) {
    this.name = props.name;
    this.callee = circuit.prop(props.arg);
  };

  var CircuitEvent = function(props) {
    this.name = props.name;
    this.callee = circuit.event(props.arg);
  };

  var CircuitElement = function(members) {
    var memberMap = {};

    members.slice().reverse().forEach(function(member) {
      // wrap object into array
      member = [].concat(member);

      var name = member[0];

      if (name in memberMap)
        return;

      var arg = member[1];
      var CircuitType = (name.indexOf('on') === 0) ? CircuitEvent : CircuitProp;

      memberMap[name] = new CircuitType({
        name: name,
        arg: arg
      });
    });

    this.memberMap = memberMap;
  };

  CircuitElement.prototype.get = function(name) {
    var member = this.memberMap[name];

    if (!member)
      return null;

    return member.callee;
  };

  CircuitElement.empty = function() {
    return new CircuitElement([]);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CircuitElement;
  else
    app.CircuitElement = CircuitElement;
})(this.app || (this.app = {}));