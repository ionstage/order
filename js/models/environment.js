(function(app) {
  'use strict';
  var helper = app.helper || require('../helper.js');
  var command = app.command || require('./command.js');

  var Module = function(props) {
    this.name = props.name;
    this.circuitElement = props.circuitElement;
  };

  var Environment = function(props) {
    this.circuitElementFactory = (props && props.circuitElementFactory);
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

  Environment.prototype.execNew = function(cmd, resolve, reject) {
    var variableName = cmd.variableName;
    var moduleName = cmd.moduleName;

    this.circuitElementFactory(moduleName).then(function(circuitElement) {
      var module = new Module({
        name: moduleName,
        circuitElement: circuitElement
      });

      this.variables.push({
        name: variableName,
        module: module
      });

      resolve();
    }.bind(this), reject);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Environment;
  else
    app.Environment = Environment;
})(this.app || (this.app = {}));