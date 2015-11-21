(function(app) {
  'use strict';

  var command = {};

  command.Noop = function() {};

  command.Declare = function() {
    this.variableName = arguments[0].trim();
    this.moduleName = arguments[1].trim();
  };

  command.Bind = function() {
    var args0 = arguments[0].split('.');
    var args1 = arguments[1].split('.');

    this.sourceVariableName = args0[0].trim();
    this.sourceMemberName = args0[1].trim();
    this.targetVariableName = args1[0].trim();
    this.targetMemberName = args1[1].trim();
  };

  command.Unbind = function() {
    // share the implementation of command.Bind
    command.Bind.apply(this, arguments);
  };

  command.parseStatement = function(line) {
    if (line.charAt(0) !== ':')
      return new command.Noop();

    var args = line.slice(1).split(' ');
    var cmd = args.shift();

    cmd = cmd.charAt(0).toUpperCase() + cmd.slice(1);
    args.unshift(null);

    if (cmd in command)
      return new (Function.prototype.bind.apply(command[cmd], args));

    return new command.Noop();
  };

  command.parseLine = function(line) {
    line = line.split('#')[0].trim();

    if (!line)
      return [];

    var m = line.match(/^([^:]+):([^:]+)$/);
    if (m)
      return [new command.Declare(m[1], m[2])];

    var substrings = line.split('>>');
    if (substrings.length === 2) {
      var args0 = substrings[0].split('.');
      var args1 = substrings[1].split('.');
      if (args0.length === 2 && args1.length === 2)
        return [new command.Bind(args0.join('.'), args1.join('.'))];
    }

    substrings = line.split('\\\\');
    if (substrings.length === 2) {
      var args0 = substrings[0].split('.');
      var args1 = substrings[1].split('.');
      if (args0.length === 2 && args1.length === 2)
        return [new command.Unbind(args0.join('.'), args1.join('.'))];
    }

    return [];
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = command;
  else
    app.command = command;
})(this.app || (this.app = {}));