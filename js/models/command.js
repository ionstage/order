(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var Command = {};

  Command.tokenize = function(s) {
    return s.match(/".*?[^\\]"|'.*?[^\\]'|:|>>|[\w"'.\/\\]+/g);
  };

  Command.split = function(line) {
    return line.slice(1).split(/([^\\]".*?[^\\]"|[^\\]'.*?[^\\]')/).map(function(s, i, args) {
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
  };

  Command.expandAbbreviation = function(s) {
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

  Command.parseStatement = function(s) {
    var line = s.split('#')[0].trim();

    if (!line) {
      return ['noop'];
    }

    if (line === ':') {
      throw new SyntaxError('OrderScript parse error: Unexpected EOF');
    }

    if (line.charAt(0) !== ':') {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  s + '"');
    }

    var args = Command.split(line);
    var arg = args.shift();
    var commandName = arg.toLowerCase();
    var commandFunc = Command.PARSE_TABLE[commandName];

    if (!commandFunc) {
      throw new SyntaxError('OrderScript parse error: Unexpected command "' +  arg + '"');
    }

    var commandArgs = commandFunc.apply(null, args);

    if (!commandArgs) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  s + '"');
    }

    return [commandName].concat(commandArgs);
  };

  Command.PARSE_TABLE = {
    noop: function() {
      return [];
    },
    new: function(variableName, moduleName) {
      if (arguments.length !== 2) {
        return null;
      }
      if (variableName.indexOf('.') !== -1 || moduleName.indexOf('.') !== -1) {
        return null;
      }
      if (!(/^[a-zA-Z]/.test(variableName)) || !(/^[a-zA-Z]/.test(moduleName))) {
        return null;
      }
      return [variableName, moduleName];
    },
    bind: function(source, target) {
      if (arguments.length !== 2) {
        return null;
      }
      var args0 = source.split('.');
      var args1 = target.split('.');
      if (args0.length !== 2 || args1.length !== 2) {
        return null;
      }
      return [args0[0], args0[1], args1[0], args1[1]];
    },
    unbind: function(source, target) {
      if (arguments.length !== 2) {
        return null;
      }
      var args0 = source.split('.');
      var args1 = target.split('.');
      if (args0.length !== 2 || args1.length !== 2) {
        return null;
      }
      return [args0[0], args0[1], args1[0], args1[1]];
    },
    send: function(receiver, dataText) {
      if (arguments.length !== 1 && arguments.length !== 2) {
        return null;
      }
      var args0 = receiver.split('.');
      if (args0.length !== 2) {
        return null;
      }
      return [args0[0], args0[1], (dataText || '')];
    },
    delete: function(variableName) {
      if (arguments.length !== 1) {
        return null;
      }
      if (variableName.indexOf('.') !== -1) {
        return null;
      }
      if (!(/^[a-zA-Z]/.test(variableName))) {
        return null;
      }
      return [variableName];
    },
    reset: function() {
      if (arguments.length) {
        return null;
      }
      return [];
    },
    load: function(filePath) {
      if (arguments.length !== 0 && arguments.length !== 1) {
        return null;
      }
      return [(filePath || '')];
    },
    save: function(filePath) {
      if (arguments.length !== 0 && arguments.length !== 1) {
        return null;
      }
      return [(filePath || '')];
    },
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Command;
  } else {
    app.Command = Command;
  }
})(this.app || (this.app = {}));
