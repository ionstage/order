(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var command = app.command || require('./command.js');
  var CircuitElement = app.CircuitElement || require('./circuit-element.js');

  var Variable = function(props) {
    this.name = props.name;
    this.moduleName = props.moduleName;
    this.circuitElement = props.circuitElement;
  };

  Variable.prototype.fetchMember = function(name) {
    var member = this.circuitElement.get(name);

    if (!member)
      throw new Error('OrderScript runtime error: member "' + this.name + '.' + name + '" is not defined');

    return member;
  };

  Variable.prototype.members = function() {
    return this.circuitElement.getAll();
  };

  var VariableTable = function() {
    this.table = {};
    this.names = [];
  };

  VariableTable.prototype.has = function(name) {
    return (this.names.indexOf(name) !== -1);
  };

  VariableTable.prototype.fetch = function(name) {
    if (!this.has(name))
      throw new Error('OrderScript runtime error: variable "' + name + '" is not defined');

    return this.table[name];
  };

  VariableTable.prototype.store = function(name, variable) {
    if (!this.has(name))
      this.names.push(name);

    this.table[name] = variable;
  };

  VariableTable.prototype.delete = function(name) {
    var index = this.names.indexOf(name);

    if (index === -1)
      return;

    delete this.table[name];
    this.names.splice(index, 1);
  };

  VariableTable.prototype.variables = function() {
    return this.names.map(function(name) {
      return this.table[name];
    }.bind(this));
  };

  var Binding = function(props) {
    this.sourceVariableName = props.sourceVariableName;
    this.sourceMemberName = props.sourceMemberName;
    this.targetVariableName = props.targetVariableName;
    this.targetMemberName = props.targetMemberName;
  };

  var BindingList = helper.inherits(function() {
    BindingList.super_.call(this);
  }, helper.List);

  BindingList.prototype.equal = function(a, b) {
    return a.sourceVariableName === b.sourceVariableName &&
           a.sourceMemberName === b.sourceMemberName &&
           a.targetVariableName === b.targetVariableName &&
           a.targetMemberName === b.targetMemberName;
  };

  BindingList.prototype.removeVariable = function(name) {
    var data = this.data;

    for (var i = data.length - 1; i >= 0; i--) {
      var item = data[i];
      if (item.sourceVariableName === name || item.targetVariableName === name) {
        data.splice(i, 1);
      }
    }
  };

  var Environment = function(props) {
    this.circuitElementFactory = props.circuitElementFactory;
    this.circuitElementDisposal = props.circuitElementDisposal;
    this.scriptLoader = props.scriptLoader;
    this.scriptSaver = props.scriptSaver;
    this.variableTable = new VariableTable();
    this.bindingList = new BindingList();
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

    if (this.variableTable.has(variableName))
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is already defined');

    var moduleName = cmd.moduleName;

    return Promise.resolve().then(function() {
      return this.circuitElementFactory({
        variableName: variableName,
        moduleName: moduleName
      });
    }.bind(this)).then(function(circuitElement) {
      if (!circuitElement)
        throw new Error('OrderScript runtime error: Invalid circuit element');

      this.variableTable.store(variableName, new Variable({
        name: variableName,
        moduleName: moduleName,
        circuitElement: circuitElement
      }));

      return cmd;
    }.bind(this));
  };

  Environment.prototype.execBind = function(cmd) {
    var bindingList = this.bindingList;
    var binding = new Binding(cmd);

    if (bindingList.contains(binding))
      throw new Error('OrderScript runtime error: Already bound');

    var variableTable = this.variableTable;

    var sourceVariable = variableTable.fetch(cmd.sourceVariableName);
    var targetVariable = variableTable.fetch(cmd.targetVariableName);

    var sourceMember = sourceVariable.fetchMember(cmd.sourceMemberName);
    var targetMember = targetVariable.fetchMember(cmd.targetMemberName);

    CircuitElement.bind(sourceMember, targetMember);

    bindingList.add(binding);

    return cmd;
  };

  Environment.prototype.execUnbind = function(cmd) {
    var bindingList = this.bindingList;
    var binding = new Binding(cmd);

    if (!bindingList.contains(binding))
      throw new Error('OrderScript runtime error: Not bound');

    var variableTable = this.variableTable;

    var sourceVariable = variableTable.fetch(cmd.sourceVariableName);
    var targetVariable = variableTable.fetch(cmd.targetVariableName);

    var sourceMember = sourceVariable.fetchMember(cmd.sourceMemberName);
    var targetMember = targetVariable.fetchMember(cmd.targetMemberName);

    CircuitElement.unbind(sourceMember, targetMember);

    bindingList.remove(binding);

    return cmd;
  };

  Environment.prototype.execSend = function(cmd) {
    var variable = this.variableTable.fetch(cmd.variableName);
    var member = variable.fetchMember(cmd.memberName);

    member(cmd.dataText);

    return cmd;
  };

  Environment.prototype.execDelete = function(cmd) {
    var variableName = cmd.variableName;
    var variable = this.variableTable.fetch(variableName);

    return Promise.resolve().then(function() {
      return this.circuitElementDisposal({
        variableName: variableName
      });
    }.bind(this)).then(function() {
      // unbind all bound members of circuit element
      variable.members().forEach(CircuitElement.unbindAll);

      this.bindingList.removeVariable(variableName);

      this.variableTable.delete(variableName);

      return cmd;
    }.bind(this));
  };

  Environment.prototype.execReset = function(cmd) {
    return Promise.all(this.variableTable.names.map(function(variableName) {
      return Promise.resolve().then(function() {
        return this.circuitElementDisposal({
          variableName: variableName
        });
      }.bind(this)).then(function() {
        var variableTable = this.variableTable;
        var variable = variableTable.fetch(variableName);

        // unbind all bound members of circuit element
        variable.members().forEach(CircuitElement.unbindAll);

        this.bindingList.removeVariable(variableName);

        variableTable.delete(variableName);
      }.bind(this));
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
    var filePath = cmd.filePath;

    return Promise.resolve().then(function() {
      var variables = this.variableTable.variables();
      var bindings = this.bindingList.toArray();

      var newCommandText = variables.map(function(variable) {
        return variable.name + ':' + variable.moduleName;
      }).join('\n');

      var bindCommandText = bindings.map(function(binding) {
        return (binding.sourceVariableName + '.' + binding.sourceMemberName + ' >> ' +
                binding.targetVariableName + '.' + binding.targetMemberName);
      }).join('\n');

      var scriptText = [newCommandText, bindCommandText].filter(function(text) {
        return text;
      }).join('\n') + '\n';

      return this.scriptSaver(filePath, scriptText);
    }.bind(this)).then(function() {
      return cmd;
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Environment;
  else
    app.Environment = Environment;
})(this.app || (this.app = {}));