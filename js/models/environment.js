(function(app) {
  'use strict';
  var helper = app.helper || require('../helper.js');
  var command = app.command || require('./command.js');
  var CircuitElement = app.CircuitElement || require('./circuit-element.js');

  var Variable = function(props) {
    this.name = props.name;
    this.circuitElement = props.circuitElement;
  };

  var Environment = function(props) {
    this.circuitElementFactory = props.circuitElementFactory;
    this.circuitElementDisposal = props.circuitElementDisposal;
    this.scriptLoader = props.scriptLoader;
    this.variableTable = {};
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
    var variableTable = this.variableTable;
    var variableName = cmd.variableName;

    if (variableName in variableTable)
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

      variableTable[variableName] = new Variable({
        name: variableName,
        circuitElement: circuitElement
      });

      return cmd;
    });
  };

  Environment.prototype.execBind = function(cmd) {
    var variableTable = this.variableTable;

    var sourceVariable = variableTable[cmd.sourceVariableName];
    var targetVariable = variableTable[cmd.targetVariableName];

    var sourceMember = sourceVariable.circuitElement.get(cmd.sourceMemberName);
    var targetMember = targetVariable.circuitElement.get(cmd.targetMemberName);

    CircuitElement.bind(sourceMember, targetMember);

    return cmd;
  };

  Environment.prototype.execUnbind = function(cmd) {
    var variableTable = this.variableTable;

    var sourceVariable = variableTable[cmd.sourceVariableName];
    var targetVariable = variableTable[cmd.targetVariableName];

    var sourceMember = sourceVariable.circuitElement.get(cmd.sourceMemberName);
    var targetMember = targetVariable.circuitElement.get(cmd.targetMemberName);

    CircuitElement.unbind(sourceMember, targetMember);

    return cmd;
  };

  Environment.prototype.execSend = function(cmd) {
    var variableTable = this.variableTable;

    var variableName = cmd.variableName;
    var variable = variableTable[variableName];

    if (!variable)
      throw new Error('CocoScript runtime error: variable "' + variableName + '" is not defined');

    var memberName = cmd.memberName;
    var member = variable.circuitElement.get(memberName);

    if (!member)
      throw new Error('CocoScript runtime error: member "' + variableName + '.' + memberName + '" is not defined');

    member(cmd.dataText);

    return cmd;
  };

  Environment.prototype.execDelete = function(cmd) {
    var variableTable = this.variableTable;

    var variableName = cmd.variableName;
    var variable = variableTable[variableName];

    if (!variable)
      throw new Error('CocoScript runtime error: variable "' + variableName + '" is not defined');

    return Promise.resolve().then(function() {
      return this.circuitElementDisposal({
        variableName: variableName
      });
    }.bind(this)).then(function() {
      // unbind all bound members of circuit element
      variable.circuitElement.getAll().forEach(CircuitElement.unbindAll);

      delete variableTable[variableName];

      return cmd;
    });
  };

  Environment.prototype.execReset = function(cmd) {
    var variableTable = this.variableTable;

    return Promise.all(Object.keys(variableTable).map(function(variableName) {
      return Promise.resolve().then(function() {
        return this.circuitElementDisposal({
          variableName: variableName
        });
      }.bind(this)).then(function() {
        var variable = variableTable[variableName];

        // unbind all bound members of circuit element
        variable.circuitElement.getAll().forEach(CircuitElement.unbindAll);

        delete variableTable[variableName];
      });
    }.bind(this))).then(function() {
      return cmd;
    });
  };

  Environment.prototype.execLoad = function(cmd) {
    var filePath = cmd.filePath;

    return Promise.resolve().then(function() {
      return this.scriptLoader(filePath);
    }.bind(this)).then(function(text) {
      return new Promise(function(resolve, reject) {
        var lines = text.split(/\r\n|\r|\n/g);

        var execLine = function(i) {
          if (i >= lines.length) {
            resolve();
            return;
          }

          this.exec(lines[i]).then(function() {
            execLine(i + 1);
          }).catch(function(e) {
            var fileName = filePath.split('/').pop();
            var lineNumber = i + 1;
            var message = fileName + ':' + lineNumber + ': ' + e.message;

            reject(new SyntaxError(message, fileName, lineNumber));
          });
        }.bind(this);

        execLine(0);
      }.bind(this));
    }.bind(this)).then(function() {
      return cmd;
    });
  };

  Environment.prototype.execSave = function(cmd) {
    // just returning command object
    return cmd;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Environment;
  else
    app.Environment = Environment;
})(this.app || (this.app = {}));