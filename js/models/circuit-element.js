(function(app) {
  'use strict';

  var circuit = require('circuit');

  var Wrapper = function(self, obj) {
    obj.unwrap = this.unwrap.bind(self);
    return self;
  };

  Wrapper.prototype.unwrap = function(key) {
    if (key === Wrapper.KEY)
      return this;
  };

  Wrapper.KEY = {};

  var CircuitProp = function(props) {
    this.name = props.name;
    this.callee = circuit.prop(props.arg);
    this.caller = this.call.bind(this);

    return new Wrapper(this, this.caller);
  };

  CircuitProp.prototype.call = function() {
    return this.callee.apply(this, arguments);
  };

  var CircuitEvent = function(props) {
    this.name = props.name;
    this.callee = circuit.event(props.arg);
    this.caller = this.call.bind(this);

    return new Wrapper(this, this.caller);
  };

  CircuitEvent.prototype.call = function() {
    return this.callee.apply(this, arguments);
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

    return member.caller;
  };

  CircuitElement.empty = function() {
    return new CircuitElement([]);
  };

  CircuitElement.bind = function(source, target) {
    var sourceMember = source.unwrap(Wrapper.KEY);
    var targetMember = target.unwrap(Wrapper.KEY);

    circuit.bind(sourceMember.callee, targetMember.callee);
  };

  CircuitElement.unbind = function(source, target) {
    var sourceMember = source.unwrap(Wrapper.KEY);
    var targetMember = target.unwrap(Wrapper.KEY);

    circuit.unbind(sourceMember.callee, targetMember.callee);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CircuitElement;
  else
    app.CircuitElement = CircuitElement;
})(this.app || (this.app = {}));