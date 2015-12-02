(function(app) {
  'use strict';
  var helper = app.helper || require('../helper.js');
  var command = app.command || require('./command.js');

  var Module = function(props) {
    this.name = props.name;
  };

  var Environment = function() {
    this.variables = [];
  };

  Environment.prototype.exec = function(s) {
    return new Promise(function(resolve, reject) {
      var cmd = command.parseStatement(command.expandAbbreviation(s));

      var name = command.names().map(helper.capitalize).filter(function(name) {
        return (cmd instanceof command[name]);
      })[0];

      if (name)
        this['exec' + name](cmd, resolve, reject);
      else
        reject();
    }.bind(this));
  };

  Environment.prototype.execNoop = function(cmd, resolve, reject) {
    resolve();
  };

  Environment.prototype.execDeclare = function(cmd, resolve, reject) {
    this.moduleFactory(cmd.moduleName).then(function(props) {
      this.variables.push({
        name: cmd.variableName,
        module: new Module(props)
      });
      resolve();
    }.bind(this), reject);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Environment;
  else
    app.Environment = Environment;
})(this.app || (this.app = {}));