(function(app) {
  'use strict';

  var command = {};

  command.Declare = function(variableName, moduleName) {
    this.variableName = variableName;
    this.moduleName = moduleName;
  };

  command.Bind = function(sourceVariableName, sourceMemberName, targetVariableName, targetMemberName) {
    this.source = {
      variableName: sourceVariableName,
      memberName: sourceMemberName
    };

    this.target = {
      variableName: targetVariableName,
      memberName: targetMemberName
    };
  };

  command.parseLine = function(line) {
    line = line.split('#')[0].trim();

    if (!line)
      return [];

    var m = line.match(/^([^:]+):([^:]+)$/);
    if (m)
      return [new command.Declare(m[1], m[2])];

    var substrings = line.split('->');
    if (substrings.length === 2) {
      var source = substrings[0].split('.');
      var target = substrings[1].split('.');
      if (source.length === 2 && target.length === 2)
        return [new command.Bind(source[0].trim(), source[1].trim(), target[0].trim(), target[1].trim())];
    }

    return [];
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = command;
  else
    app.command = command;
})(this.app || (this.app = {}));