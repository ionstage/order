(function(app) {
  'use strict';

  var command = {};

  command.Declare = function(variableName, moduleName) {
    this.variableName = variableName;
    this.moduleName = moduleName;
  };

  command.parseLine = function(line) {
    line = line.split('#')[0].trim();

    if (!line)
      return [];

    var m = line.match(/^([^:]+):([^:]+)$/);
    if (m)
      return [new command.Declare(m[1], m[2])];
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = command;
  else
    app.command = command;
})(this.app || (this.app = {}));