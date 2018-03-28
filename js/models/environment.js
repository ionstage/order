(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Command = app.Command || require('./command.js');
  var CircuitModule = app.CircuitModule || require('./circuit-module.js');

  var Environment = function(props) {
    this.circuitModuleLoader = props.circuitModuleLoader;
    this.circuitModuleUnloader = props.circuitModuleUnloader;
    this.scriptLoader = props.scriptLoader;
    this.scriptSaver = props.scriptSaver;
    this.variableTable = {};
    this.bindings = [];
  };

  Environment.prototype.binding = function(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
    return helper.find(this.bindings, function(binding) {
      return (binding.sourceVariableName === sourceVariableName &&
              binding.sourceMemberName === sourceMemberName &&
              binding.targetVariableName === targetVariableName &&
              binding.targetMemberName === targetMemberName);
    });
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

  Environment.prototype.delete = function(variableName) {
    this.unbindAll(variableName);
    helper.remove(this.bindings, helper.find(this.bindings, function(binding) {
      return (binding.sourceVariableName === variableName && binding.sourceVariableName === variableName);
    }));
    delete this.variableTable[variableName];
  };

  Environment.prototype.unbindAll = function(variableName) {
    this.bindings.filter(function(binding) {
      return (binding.sourceVariableName === variableName || binding.targetVariableName === variableName);
    }).forEach(function(binding) {
      var source = this.fetch(binding.sourceVariableName, binding.sourceMemberName);
      var target = this.fetch(binding.targetVariableName, binding.targetMemberName);
      CircuitModule.unbind(source, target);
    }.bind(this));
  };

  Environment.prototype.generateScript = function() {
    var variableScript = helper.values(this.variableTable).map(function(variable) {
      return variable.name + ':' + variable.moduleName;
    }).join('\n');
    var bindingScript = this.bindings.map(function(binding) {
      return (binding.sourceVariableName + '.' + binding.sourceMemberName + ' >> ' +
              binding.targetVariableName + '.' + binding.targetMemberName);
    }).join('\n');
    return (variableScript + '\n' + bindingScript).trim() + '\n';
  };

  Environment.prototype.exec = function(s) {
    return Promise.resolve().then(function() {
      var cmd = Command.parseStatement(Command.expandAbbreviation(s));
      return this['exec' + helper.capitalize(cmd.name)].apply(this, cmd.args);
    }.bind(this));
  };

  Environment.prototype.execNoop = function() {};

  Environment.prototype.execNew = function(variableName, moduleName) {
    if (this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is already defined');
    }

    return this.circuitModuleLoader(variableName, moduleName).then(function(circuitModule) {
      if (!circuitModule) {
        throw new Error('OrderScript runtime error: Invalid circuit module');
      }

      this.variableTable[variableName] = new Environment.Variable({
        name: variableName,
        moduleName: moduleName,
        circuitModule: circuitModule,
      });
    }.bind(this));
  };

  Environment.prototype.execBind = function(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
    var binding = this.binding(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName);
    if (binding) {
      throw new Error('OrderScript runtime error: Already bound');
    }

    var sourceMember = this.fetch(sourceVariableName, sourceMemberName);
    var targetMember = this.fetch(targetVariableName, targetMemberName);

    CircuitModule.bind(sourceMember, targetMember);

    this.bindings.push(new Environment.Binding({
      sourceVariableName: sourceVariableName,
      sourceMemberName: sourceMemberName,
      targetVariableName: targetVariableName,
      targetMemberName: targetMemberName,
    }));
  };

  Environment.prototype.execUnbind = function(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
    var binding = this.binding(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName);
    if (!binding) {
      throw new Error('OrderScript runtime error: Not bound');
    }

    var sourceMember = this.fetch(sourceVariableName, sourceMemberName);
    var targetMember = this.fetch(targetVariableName, targetMemberName);

    CircuitModule.unbind(sourceMember, targetMember);

    helper.remove(this.bindings, binding);
  };

  Environment.prototype.execSend = function(variableName, memberName, dataText) {
    var member = this.fetch(variableName, memberName);
    member(dataText);
  };

  Environment.prototype.execDelete = function(variableName) {
    if (!this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is not defined');
    }
    return this.circuitModuleUnloader(variableName).then(function() {
      this.delete(variableName);
    }.bind(this));
  };

  Environment.prototype.execReset = function() {
    return Promise.all(Object.keys(this.variableTable).map(function(variableName) {
      return this.circuitModuleUnloader(variableName).then(function() {
        this.delete(variableName);
      }.bind(this));
    }.bind(this)));
  };

  Environment.prototype.execLoad = function(filePath) {
    return this.scriptLoader(filePath).then(function(result) {
      return result.text.split(/\r\n|\r|\n/g).reduce(function(p, line, i) {
        return p.then(function() {
          return this.exec(line).catch(function(e) {
            var fileName = result.fileName;
            var lineNumber = i + 1;
            var message = fileName + ':' + lineNumber + ': ' + e.message;
            throw new SyntaxError(message, fileName, lineNumber);
          });
        }.bind(this));
      }.bind(this), Promise.resolve());
    }.bind(this));
  };

  Environment.prototype.execSave = function(filePath) {
    return this.scriptSaver(filePath, this.generateScript());
  };

  Environment.Variable = function(props) {
    this.name = props.name;
    this.moduleName = props.moduleName;
    this.circuitModule = props.circuitModule;
  };

  Environment.Binding = function(props) {
    this.sourceVariableName = props.sourceVariableName;
    this.sourceMemberName = props.sourceMemberName;
    this.targetVariableName = props.targetVariableName;
    this.targetMemberName = props.targetMemberName;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Environment;
  } else {
    app.Environment = Environment;
  }
})(this.app || (this.app = {}));
