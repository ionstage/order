(function(app) {
  'use strict';

  var circuit = require('circuit');

  var Wrapper = function(obj, self) {
    obj.unwrap = Wrapper.unwrap.bind(self);
    return obj;
  };

  Wrapper.unwrap = function(key) {
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
    var caller = CircuitElementMember.prototype.call.bind(this);

    this.name = name;
    this.callee = callee;
    this.wrapper = new Wrapper(caller, this);
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

    return member.wrapper;
  };

  CircuitElement.prototype.getAll = function() {
    return this.names.map(function(name) {
      return this.memberTable[name].wrapper;
    }.bind(this));
  };

  CircuitElement.empty = function() {
    return new CircuitElement([]);
  };

  CircuitElement.bind = function(sourceWrapper, targetWrapper) {
    var sourceMember = sourceWrapper.unwrap(Wrapper.KEY);
    var targetMember = targetWrapper.unwrap(Wrapper.KEY);

    circuit.bind(sourceMember.callee, targetMember.callee);

    sourceMember.targets.push(targetMember);
    targetMember.sources.push(sourceMember);
  };

  CircuitElement.unbind = function(sourceWrapper, targetWrapper) {
    var sourceMember = sourceWrapper.unwrap(Wrapper.KEY);
    var targetMember = targetWrapper.unwrap(Wrapper.KEY);

    circuit.unbind(sourceMember.callee, targetMember.callee);

    var sourceMemberTargets = sourceMember.targets;
    var targetMemberSources = targetMember.sources;

    sourceMemberTargets.splice(sourceMemberTargets.indexOf(targetMember), 1);
    targetMemberSources.splice(targetMemberSources.indexOf(sourceMember), 1);
  };

  CircuitElement.unbindAll = function(wrapper) {
    var member = wrapper.unwrap(Wrapper.KEY);

    member.sources.forEach(function(source) {
      CircuitElement.unbind(source.wrapper, member.wrapper);
    });

    member.targets.forEach(function(target) {
      CircuitElement.unbind(member.wrapper, target.wrapper);
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CircuitElement;
  else
    app.CircuitElement = CircuitElement;
})(this.app || (this.app = {}));