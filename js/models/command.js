(function(app) {
  'use strict';

  var command = {};

  command.Noop = function() {};

  command.Declare = function() {
    if (arguments.length !== 2)
      throw new TypeError('Type error');

    var variableName = arguments[0].trim();
    var moduleName = arguments[1].trim();

    if (variableName.indexOf('.') !== -1 || moduleName.indexOf('.') !== -1)
      throw new TypeError('Type error');

    this.variableName = variableName;
    this.moduleName = moduleName;
  };

  command.Bind = function() {
    if (arguments.length !== 2)
      throw new TypeError('Type error');

    var args0 = arguments[0].split('.');
    var args1 = arguments[1].split('.');

    if (args0.length !== 2 || args1.length !== 2)
      throw new TypeError('Type error');

    this.sourceVariableName = args0[0].trim();
    this.sourceMemberName = args0[1].trim();
    this.targetVariableName = args1[0].trim();
    this.targetMemberName = args1[1].trim();
  };

  command.Unbind = function() {
    // share the implementation of command.Bind
    command.Bind.apply(this, arguments);
  };

  command.expandAbbreviation = function(s) {
    var m = s.match(/^([^:]+):([^:]+)$/);
    if (m)
      return ':declare ' + m[1].trim() + ' ' + m[2].trim();

    var substrings = s.split('>>');
    if (substrings.length === 2) {
      var args0 = substrings[0].trim().split('.');
      var args1 = substrings[1].trim().split('.');

      if (args0.length === 2 && args1.length === 2)
        return ':bind ' + args0.join('.') + ' ' + args1.join('.');
    }

    return s;
  };

  command.parseStatement = function(s) {
    var line = s.split('#')[0].trim();

    if (!line)
      return new command.Noop();

    if (line === ':')
      throw new SyntaxError('CocoScript parse error: Unexpected EOF');

    if (line.charAt(0) !== ':')
      throw new SyntaxError('CocoScript parse error: Unexpected identifier "' +  s + '"');

    var args = line.slice(1).split(/[\s]+/);
    var cmd = args.shift();

    cmd = cmd.charAt(0).toUpperCase() + cmd.slice(1);

    if (!(cmd in command))
      throw new SyntaxError('CocoScript parse error: Unexpected command "' +  cmd.toLowerCase() + '"');

    args.unshift(null);

    try {
      return new (Function.prototype.bind.apply(command[cmd], args));
    } catch (e) {
      throw new SyntaxError('CocoScript parse error: Unexpected identifier "' +  s + '"');
    }
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = command;
  else
    app.command = command;
})(this.app || (this.app = {}));