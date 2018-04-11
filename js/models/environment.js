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

  Environment.prototype.fetch = function(variableName, memberName) {
    if (!this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is not defined');
    }
    var member = this.variableTable[variableName].circuitModule.get(memberName);
    if (!member) {
      throw new Error('OrderScript runtime error: member "' + variableName + '.' + memberName + '" is not defined');
    }
    return member;
  };

  Environment.prototype.findVariable = function(member) {
    return helper.find(helper.values(this.variableTable), function(variable) {
      return (variable.circuitModule.get(member.name) === member);
    });
  };

  Environment.prototype.findBinding = function(sourceMember, targetMember) {
    return helper.find(this.bindings, function(binding) {
      return (binding.sourceMember === sourceMember && binding.targetMember === targetMember);
    });
  };

  Environment.prototype.loadVariable = function(name, moduleName) {
    return this.circuitModuleLoader(name, moduleName).then(function(circuitModule) {
      if (!circuitModule) {
        throw new Error('OrderScript runtime error: Invalid circuit module');
      }
      this.variableTable[name] = new Environment.Variable({
        name: name,
        moduleName: moduleName,
        circuitModule: circuitModule,
      });
    }.bind(this));
  };

  Environment.prototype.unloadVariable = function(name) {
    return this.circuitModuleUnloader(name).then(function() {
      this.deleteVariable(name);
    }.bind(this));
  };

  Environment.prototype.deleteVariable = function(name) {
    var variable = this.variableTable[name];
    this.bindings.filter(function(binding) {
      return (this.findVariable(binding.sourceMember) === variable || this.findVariable(binding.targetMember) === variable);
    }.bind(this)).forEach(function(binding) {
      CircuitModule.unbind(binding.sourceMember, binding.targetMember);
      helper.remove(this.bindings, binding);
    }.bind(this));
    delete this.variableTable[name];
  };

  Environment.prototype.loadScript = function(text, fileName) {
    return text.split(/\r\n|\r|\n/g).reduce(function(p, line, i) {
      return p.then(function() {
        return this.exec(line).catch(function(e) {
          throw new SyntaxError(e.message, fileName, i + 1);
        });
      }.bind(this));
    }.bind(this), Promise.resolve());
  };

  Environment.prototype.generateScript = function() {
    var variableScript = helper.values(this.variableTable).map(function(variable) {
      return variable.name + ':' + variable.moduleName;
    }).join('\n');
    var bindingScript = this.bindings.map(function(binding) {
      return (this.findVariable(binding.sourceMember).name + '.' + binding.sourceMember.name + ' >> ' +
              this.findVariable(binding.targetMember).name + '.' + binding.targetMember.name);
    }.bind(this)).join('\n');
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
    return this.loadVariable(variableName, moduleName);
  };

  Environment.prototype.execBind = function(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
    var sourceMember = this.fetch(sourceVariableName, sourceMemberName);
    var targetMember = this.fetch(targetVariableName, targetMemberName);
    var binding = this.findBinding(sourceMember, targetMember);

    if (binding) {
      throw new Error('OrderScript runtime error: Already bound');
    }

    CircuitModule.bind(sourceMember, targetMember);

    this.bindings.push(new Environment.Binding({
      sourceMember: sourceMember,
      targetMember: targetMember,
    }));
  };

  Environment.prototype.execUnbind = function(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
    var sourceMember = this.fetch(sourceVariableName, sourceMemberName);
    var targetMember = this.fetch(targetVariableName, targetMemberName);
    var binding = this.findBinding(sourceMember, targetMember);

    if (!binding) {
      throw new Error('OrderScript runtime error: Not bound');
    }

    CircuitModule.unbind(sourceMember, targetMember);

    helper.remove(this.bindings, binding);
  };

  Environment.prototype.execSend = function(variableName, memberName, dataText) {
    this.fetch(variableName, memberName)(dataText);
  };

  Environment.prototype.execDelete = function(variableName) {
    if (!this.variableTable.hasOwnProperty(variableName)) {
      throw new Error('OrderScript runtime error: variable "' + variableName + '" is not defined');
    }
    return this.unloadVariable(variableName);
  };

  Environment.prototype.execReset = function() {
    return Promise.all(Object.keys(this.variableTable).map(function(variableName) {
      return this.unloadVariable(variableName);
    }.bind(this)));
  };

  Environment.prototype.execLoad = function(filePath) {
    return this.scriptLoader(filePath).then(function(result) {
      return this.loadScript(result.text, result.fileName);
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
    this.sourceMember = props.sourceMember;
    this.targetMember = props.targetMember;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Environment;
  } else {
    app.Environment = Environment;
  }
})(this.app || (this.app = {}));
