(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var command = {};

  command.Noop = function() {
    this.args = [];
  };

  command.New = function() {
    if (arguments.length !== 2) {
      throw new TypeError('Type error');
    }

    var variableName = arguments[0];
    var moduleName = arguments[1];

    if (variableName.indexOf('.') !== -1 || moduleName.indexOf('.') !== -1) {
      throw new TypeError('Type error');
    }

    if (!(/^[a-zA-Z]/.test(variableName)) || !(/^[a-zA-Z]/.test(moduleName))) {
      throw new TypeError('Type error');
    }

    this.args = [variableName, moduleName];
  };

  command.Bind = function() {
    if (arguments.length !== 2) {
      throw new TypeError('Type error');
    }

    var args0 = arguments[0].split('.');
    var args1 = arguments[1].split('.');

    if (args0.length !== 2 || args1.length !== 2) {
      throw new TypeError('Type error');
    }

    this.args = [args0[0], args0[1], args1[0], args1[1]];
  };

  command.Unbind = function() {
    // share the implementation of command.Bind
    command.Bind.apply(this, arguments);
  };

  command.Send = function() {
    if (arguments.length !== 1 && arguments.length !== 2) {
      throw new TypeError('Type error');
    }

    var args0 = arguments[0].split('.');

    if (args0.length !== 2) {
      throw new TypeError('Type error');
    }

    this.args = [args0[0], args0[1], (arguments[1] || '')];
  };

  command.Delete = function() {
    if (arguments.length !== 1) {
      throw new TypeError('Type error');
    }

    var variableName = arguments[0];

    if (variableName.indexOf('.') !== -1) {
      throw new TypeError('Type error');
    }

    if (!(/^[a-zA-Z]/.test(variableName))) {
      throw new TypeError('Type error');
    }

    this.args = [variableName];
  };

  command.Reset = function() {
    if (arguments.length) {
      throw new TypeError('Type error');
    }
    this.args = [];
  };

  command.Load = function() {
    if (arguments.length !== 0 && arguments.length !== 1) {
      throw new TypeError('Type error');
    }

    this.args = [(arguments[0] || '')];
  };

  command.Save = function() {
    if (arguments.length !== 0 && arguments.length !== 1) {
      throw new TypeError('Type error');
    }

    this.args = [(arguments[0] || '')];
  };

  command.expandAbbreviation = function(s) {
    var line = s.split('#')[0].trim();

    if (!line || line.charAt(0) === ':') {
      return s;
    }

    var m = line.match(/^([^:]+):([^:]+)$/);
    if (m) {
      return ':new ' + m[1].trim() + ' ' + m[2].trim();
    }

    var substrings = line.split('>>');
    if (substrings.length === 2) {
      var args0 = substrings[0].trim().split('.');
      var args1 = substrings[1].trim().split('.');

      if (args0.length === 2 && args1.length === 2) {
        return ':bind ' + args0.join('.') + ' ' + args1.join('.');
      }
    }

    substrings = line.split('<<');
    if (substrings.length === 2) {
      var args0 = substrings[0].trim().split('.');
      var arg1 = substrings[1].trim();

      if (args0.length === 2) {
        return ':send ' + args0.join('.') + (arg1 ? ' ' + arg1 : '');
      }
    }

    return s;
  };

  command.parseStatement = function(s) {
    var line = s.split('#')[0].trim();

    if (!line) {
      var cmd = new command.Noop();
      cmd.name = 'noop';
      return cmd;
    }

    if (line === ':') {
      throw new SyntaxError('OrderScript parse error: Unexpected EOF');
    }

    if (line.charAt(0) !== ':') {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  s + '"');
    }

    // split line string by space, but ignore space in quotes
    var args = line.slice(1).split(/([^\\]".*?[^\\]"|[^\\]'.*?[^\\]')/).map(function(s, i, args) {
      if (i % 2 === 0) {
        return s.split(/[\s]+/).map(function(arg) {
          return arg.replace(/\\'/g, '\'').replace(/\\"/g, '"');
        });
      } else {
        s = s.trim();
        var first = s.charAt(0);
        var last = s.slice(-1);
        if (first === last && (first === '\'' || first === '"')) {
          s = s.slice(1, -1).replace(/\\(.)/g, '$1');
        }
        return s;
      }
    }).reduce(function(prev, curr) {
      return prev.concat(curr);
    }, []).filter(function(arg) {
      return arg;
    });

    var arg = args.shift();
    var commandName = arg.toLowerCase();
    var commandType = command[helper.capitalize(commandName)];

    if (!commandType) {
      throw new SyntaxError('OrderScript parse error: Unexpected command "' +  arg + '"');
    }

    args.unshift(null);

    var cmd;
    try {
      cmd = new (Function.prototype.bind.apply(commandType, args));
    } catch (e) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  s + '"');
    }

    cmd.name = commandName;

    return cmd;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = command;
  } else {
    app.command = command;
  }
})(this.app || (this.app = {}));
