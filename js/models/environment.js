(function(app) {
  'use strict';
  var helper = app.helper || require('../helper.js');
  var command = app.command || require('./command.js');
  var CircuitElement = require('./circuit-element.js');

  var Variable = function(props) {
    this.name = props.name;
    this.circuitElement = props.circuitElement;
  };

  var Environment = function(props) {
    this.circuitElementFactory = props.circuitElementFactory;
    this.variables = [];
  };

  Environment.prototype.findVariable = function(name) {
    return this.variables.filter(function(variable) {
      return variable.name === name;
    })[0];
  };

  Environment.prototype.exec = function(s) {
    return Promise.resolve().then(function() {
      var cmd = command.parseStatement(command.expandAbbreviation(s));
      return this['exec' + helper.capitalize(cmd.name)](cmd);
    }.bind(this));
  };

  Environment.prototype.execNoop = function(cmd) {
    return cmd;
  };

  Environment.prototype.execNew = function(cmd) {
    var variableName = cmd.variableName;
    var variable = this.findVariable(variableName);

    if (variable)
      throw new Error('CocoScript runtime error: variable "' + variableName + '" is already defined');

    var moduleName = cmd.moduleName;

    return Promise.resolve().then(function() {
      return this.circuitElementFactory({
        variableName: variableName,
        moduleName: moduleName
      });
    }.bind(this)).then(function(circuitElement) {
      if (!circuitElement)
        throw new Error('CocoScript runtime error: Invalid circuit element');

      this.variables.push(new Variable({
        name: variableName,
        circuitElement: circuitElement
      }));

      return cmd;
    }.bind(this));
  };

  Environment.prototype.execBind = function(cmd) {
    var sourceVariable = this.findVariable(cmd.sourceVariableName);
    var targetVariable = this.findVariable(cmd.targetVariableName);

    var sourceMember = sourceVariable.circuitElement.get(cmd.sourceMemberName);
    var targetMember = targetVariable.circuitElement.get(cmd.targetMemberName);

    CircuitElement.bind(sourceMember, targetMember);

    return cmd;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Environment;
  else
    app.Environment = Environment;
})(this.app || (this.app = {}));