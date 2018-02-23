(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');
  var Wrapper = helper.wrapper();

  var CircuitModuleMember = function(props) {
    var name = props.name;
    var arg = props.arg;
    var type = props.type;
    var callee = circuit[type](arg);
    var caller = CircuitModuleMember.prototype.call.bind(this);

    this.name = name;
    this.callee = callee;
    this.wrapper = new Wrapper(this, caller);
    this.sources = [];
    this.targets = [];
  };

  CircuitModuleMember.prototype.call = function() {
    return this.callee.apply(this, arguments);
  };

  var CircuitModule = function(members) {
    var memberTable = {};
    var names = [];

    members.slice().reverse().forEach(function(props) {
      var name = props.name;

      if (name in memberTable) {
        return;
      }

      memberTable[name] = new CircuitModuleMember(props);
      names.unshift(name);
    });

    this.memberTable = memberTable;
    this.names = names;
  };

  CircuitModule.prototype.get = function(name) {
    var member = this.memberTable[name];

    if (!member) {
      return null;
    }

    return member.wrapper;
  };

  CircuitModule.prototype.getAll = function() {
    return this.names.map(function(name) {
      return this.memberTable[name].wrapper;
    }.bind(this));
  };

  CircuitModule.bind = function(sourceWrapper, targetWrapper) {
    var sourceMember = sourceWrapper.unwrap(Wrapper.KEY);
    var targetMember = targetWrapper.unwrap(Wrapper.KEY);

    circuit.bind(sourceMember.callee, targetMember.callee);

    sourceMember.targets.push(targetMember);
    targetMember.sources.push(sourceMember);
  };

  CircuitModule.unbind = function(sourceWrapper, targetWrapper) {
    var sourceMember = sourceWrapper.unwrap(Wrapper.KEY);
    var targetMember = targetWrapper.unwrap(Wrapper.KEY);

    circuit.unbind(sourceMember.callee, targetMember.callee);

    var sourceMemberTargets = sourceMember.targets;
    var targetMemberSources = targetMember.sources;

    sourceMemberTargets.splice(sourceMemberTargets.indexOf(targetMember), 1);
    targetMemberSources.splice(targetMemberSources.indexOf(sourceMember), 1);
  };

  CircuitModule.unbindAll = function(wrapper) {
    var member = wrapper.unwrap(Wrapper.KEY);

    member.sources.forEach(function(source) {
      CircuitModule.unbind(source.wrapper, member.wrapper);
    });

    member.targets.forEach(function(target) {
      CircuitModule.unbind(member.wrapper, target.wrapper);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitModule;
  } else {
    app.CircuitModule = CircuitModule;
  }
})(this.app || (this.app = {}));
