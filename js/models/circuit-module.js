(function(app) {
  'use strict';

  var circuit = require('circuit');
  var helper = app.helper || require('../helper.js');
  var Wrapper = helper.wrapper();

  var CircuitModule = function(members) {
    var memberTable = {};
    var names = [];

    members.slice().reverse().forEach(function(props) {
      var name = props.name;

      if (name in memberTable) {
        return;
      }

      memberTable[name] = new CircuitModule.Member(props);
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
  };

  CircuitModule.unbind = function(sourceWrapper, targetWrapper) {
    var sourceMember = sourceWrapper.unwrap(Wrapper.KEY);
    var targetMember = targetWrapper.unwrap(Wrapper.KEY);
    circuit.unbind(sourceMember.callee, targetMember.callee);
  };

  CircuitModule.Member = (function() {
    var Member = function(props) {
      this.name = props.name;
      this.callee = circuit[props.type](props.arg);
      this.wrapper = new Wrapper(this, this.call.bind(this));
    };

    Member.prototype.call = function() {
      return this.callee.apply(this, arguments);
    };

    return Member;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitModule;
  } else {
    app.CircuitModule = CircuitModule;
  }
})(this.app || (this.app = {}));
