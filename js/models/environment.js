(function(app) {
  'use strict';
  var helper = app.helper || require('../helper.js');
  var command = app.command || require('./command.js');

  var Environment = function(props) {
    this.circuitElementFactory = (props && props.circuitElementFactory);
    this.variables = [];
  };

  Environment.prototype.exec = function(s) {
    try {
      var cmd = command.parseStatement(command.expandAbbreviation(s));
      return this['exec' + helper.capitalize(cmd.name)](cmd);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  Environment.prototype.execNoop = function(cmd) {
    return Promise.resolve(cmd);
  };

  Environment.prototype.execNew = function(cmd) {
    var variableName = cmd.variableName;
    var moduleName = cmd.moduleName;

    return this.circuitElementFactory({
      variableName: variableName,
      moduleName: moduleName
    }).then(function(circuitElement) {
      this.variables.push({
        name: variableName,
        circuitElement: circuitElement
      });

      return cmd;
    }.bind(this));
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Environment;
  else
    app.Environment = Environment;
})(this.app || (this.app = {}));