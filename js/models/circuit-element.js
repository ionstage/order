(function(app) {
  'use strict';

  var circuit = require('circuit');

  var CircuitProp = function(props) {
    this.name = props.name;
    this.callee = circuit.prop(props.arg);
  };

  var CircuitEvent = function(props) {
    this.name = props.name;
    this.callee = circuit.event();
  };

  var CircuitElement = function(members) {
    this.members = members.map(function(member) {
      // wrap object into array
      member = [].concat(member);

      var name = member[0];
      var arg = member[1];

      var CircuitType = (name.indexOf('on') === 0) ? CircuitEvent : CircuitProp;

      return new CircuitType({
        name: name,
        arg: arg
      });
    });
  };

  CircuitElement.prototype.get = function(name) {
    var member = this.members.filter(function(member) {
      return member.name === name;
    })[0];

    if (!member)
      return null;

    return member.callee;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CircuitElement;
  else
    app.CircuitElement = CircuitElement;
})(this.app || (this.app = {}));