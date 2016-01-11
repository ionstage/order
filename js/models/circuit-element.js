(function(app) {
  'use strict';

  var circuit = require('circuit');

  var Wrapper = function(obj, self) {
    obj.unwrap = this.unwrap.bind(self);
    return obj;
  };

  Wrapper.prototype.unwrap = function(key) {
    if (key === Wrapper.KEY)
      return this;
  };

  Wrapper.KEY = {};

  var CircuitElementMember = function(props) {
    var name = props.name;
    var arg = props.arg;
    var type = props.type;

    if (typeof type === 'undefined' || (type !== 'prop' && type !== 'event'))
      type = (name.indexOf('on') === 0) ? 'event' : 'prop';

    var callee = circuit[type](arg);
    var caller = this.call.bind(this);

    this.name = name;
    this.callee = callee;
    this.caller = new Wrapper(caller, this);
    this.sources = [];
    this.targets = [];
  };

  CircuitElementMember.prototype.call = function() {
    return this.callee.apply(this, arguments);
  };

  var CircuitElement = function(members) {
    var memberTable = {};
    var names = [];

    members.slice().reverse().forEach(function(props) {
      var name = props.name;

      if (name in memberTable)
        return;

      memberTable[name] = new CircuitElementMember(props);
      names.unshift(name);
    });

    this.memberTable = memberTable;
    this.names = names;
  };

  CircuitElement.prototype.get = function(name) {
    var member = this.memberTable[name];

    if (!member)
      return null;

    return member.caller;
  };

  CircuitElement.prototype.getAll = function() {
    return this.names.map(function(name) {
      return this.memberTable[name].caller;
    }.bind(this));
  };

  CircuitElement.empty = function() {
    return new CircuitElement([]);
  };

  CircuitElement.bind = function(source, target) {
    var sourceMember = source.unwrap(Wrapper.KEY);
    var targetMember = target.unwrap(Wrapper.KEY);

    circuit.bind(sourceMember.callee, targetMember.callee);

    sourceMember.targets.push(targetMember);
    targetMember.sources.push(sourceMember);
  };

  CircuitElement.unbind = function(source, target) {
    var sourceMember = source.unwrap(Wrapper.KEY);
    var targetMember = target.unwrap(Wrapper.KEY);

    circuit.unbind(sourceMember.callee, targetMember.callee);

    var sourceMemberTargets = sourceMember.targets;
    var targetMemberSources = targetMember.sources;

    sourceMemberTargets.splice(sourceMemberTargets.indexOf(targetMember), 1);
    targetMemberSources.splice(targetMemberSources.indexOf(sourceMember), 1);
  };

  CircuitElement.unbindAll = function(caller) {
    var member = caller.unwrap(Wrapper.KEY);

    member.sources.forEach(function(source) {
      CircuitElement.unbind(source.caller, member.caller);
    });

    member.targets.forEach(function(target) {
      CircuitElement.unbind(member.caller, target.caller);
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CircuitElement;
  else
    app.CircuitElement = CircuitElement;
})(this.app || (this.app = {}));