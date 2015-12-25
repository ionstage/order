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

  var CircuitElementMember = function(props) {
    var name = props.name;
    var arg = props.arg;

    var type = (name.indexOf('on') === 0) ? 'event' : 'prop';
    var callee = circuit[type](arg);
    var caller = this.call.bind(this);

    this.name = name;
    this.callee = callee;
    this.caller = caller;

    return new Wrapper(this, caller);
  };

  CircuitElementMember.prototype.call = function() {
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

      memberMap[name] = new CircuitElementMember({
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