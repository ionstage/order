(function(app) {
  'use strict';
  var command = app.command || require('./command.js');

  var Environment = function() {
    this.variables = [];
  };

  Environment.prototype.exec = function(s) {
    return new Promise(function(resolve, reject) {
      var cmd = command.parseStatement(command.expandAbbreviation(s));

      if (cmd instanceof command.Noop) {
        resolve();
      } else if (cmd instanceof command.Declare) {
        this.moduleFactory(cmd.moduleName).then(function(module) {
          this.variables.push({
            name: cmd.variableName,
            module: module
          });
          resolve();
        }.bind(this), reject);
      } else {
        reject();
      }
    }.bind(this));
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Environment;
  else
    app.Environment = Environment;
})(this.app || (this.app = {}));