(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var command = app.command || require('./command.js');
  var CircuitModule = app.CircuitModule || require('./circuit-module.js');

  var Variable = function(props) {
    this.name = props.name;
    this.moduleName = props.moduleName;
    this.circuitModule = props.circuitModule;
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
    this.circuitModuleLoader = props.circuitModuleLoader;
    this.circuitModuleUnloader = props.circuitModuleUnloader;
    this.scriptLoader = props.scriptLoader;
    this.scriptSaver = props.scriptSaver;
    this.variableTable = {};
    this.bindingList = new BindingList();
  };

  Environment.prototype.fetch = function(variableName, moduleName) {
    if (!this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is not defined');
    }
    var member = this.variableTable[variableName].circuitModule.get(moduleName);
    if (!member) {
      throw new Error('OrderScript runtime error: member "' + variableName + '.' + moduleName + '" is not defined');
    }
    return member;
  };

  Environment.prototype.unbindAll = function(variableName) {
    this.bindingList.toArray().filter(function(binding) {
      return (binding.sourceVariableName === variableName || binding.targetVariableName === variableName);
    }).forEach(function(binding) {
      var source = this.fetch(binding.sourceVariableName, binding.sourceMemberName);
      var target = this.fetch(binding.targetVariableName, binding.targetMemberName);
      CircuitModule.unbind(source, target);
    }.bind(this));
  };

  Environment.prototype.exec = function(s) {
    return Promise.resolve().then(function() {
      var cmd = command.parseStatement(command.expandAbbreviation(s));
      return this['exec' + helper.capitalize(cmd.name)](cmd);
    }.bind(this));
  };

  Environment.prototype.execNoop = function() {};

  Environment.prototype.execNew = function(cmd) {
    var variableName = cmd.variableName;

    if (this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is already defined');
    }

    var moduleName = cmd.moduleName;

    return this.circuitModuleLoader(variableName, moduleName).then(function(circuitModule) {
      if (!circuitModule) {
        throw new Error('OrderScript runtime error: Invalid circuit module');
      }

      this.variableTable[variableName] = new Variable({
        name: variableName,
        moduleName: moduleName,
        circuitModule: circuitModule,
      });
    }.bind(this));
  };

  Environment.prototype.execBind = function(cmd) {
    var bindingList = this.bindingList;
    var binding = new Binding(cmd);

    if (bindingList.contains(binding)) {
      throw new Error('OrderScript runtime error: Already bound');
    }

    var sourceMember = this.fetch(cmd.sourceVariableName, cmd.sourceMemberName);
    var targetMember = this.fetch(cmd.targetVariableName, cmd.targetMemberName);

    CircuitModule.bind(sourceMember, targetMember);

    bindingList.add(binding);
  };

  Environment.prototype.execUnbind = function(cmd) {
    var bindingList = this.bindingList;
    var binding = new Binding(cmd);

    if (!bindingList.contains(binding)) {
      throw new Error('OrderScript runtime error: Not bound');
    }

    var sourceMember = this.fetch(cmd.sourceVariableName, cmd.sourceMemberName);
    var targetMember = this.fetch(cmd.targetVariableName, cmd.targetMemberName);

    CircuitModule.unbind(sourceMember, targetMember);

    bindingList.remove(binding);
  };

  Environment.prototype.execSend = function(cmd) {
    var member = this.fetch(cmd.variableName, cmd.memberName);
    member(cmd.dataText);
  };

  Environment.prototype.execDelete = function(cmd) {
    var variableName = cmd.variableName;
    if (!this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is not defined');
    }
    return this.circuitModuleUnloader(variableName).then(function() {
      this.unbindAll(variableName);

      this.bindingList.removeVariable(variableName);

      delete this.variableTable[variableName];
    }.bind(this));
  };

  Environment.prototype.execReset = function(cmd) {
    return Promise.all(Object.keys(this.variableTable).map(function(variableName) {
      return this.circuitModuleUnloader(variableName).then(function() {
        if (!this.variableTable.hasOwnProperty(variableName)) {
          throw new Error('OrderScript runtime error: variable "' + variableName + '" is not defined');
        }

        this.unbindAll(variableName);

        this.bindingList.removeVariable(variableName);

        delete this.variableTable[variableName];
      }.bind(this));
    }.bind(this)));
  };

  Environment.prototype.execLoad = function(cmd) {
    var filePath = cmd.filePath;

    return this.scriptLoader(filePath).then(function(text) {
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
    }.bind(this));
  };

  Environment.prototype.execSave = function(cmd) {
    var filePath = cmd.filePath;

    return Promise.resolve().then(function() {
      var variables = Object.keys(this.variableTable).map(function(name) {
        return this.variableTable[name];
      }.bind(this));
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
    }.bind(this));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Environment;
  } else {
    app.Environment = Environment;
  }
})(this.app || (this.app = {}));
