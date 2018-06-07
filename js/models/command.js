(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');

  var Command = {};

  Command.tokenize = function(s) {
    var tokens = s.match(/".*?[^\\]"|'.*?[^\\]'|\.|#|:|>>|<<|[\w"'\/\\]+/g) || [];
    var index = tokens.indexOf('#');
    return (index !== -1 ? tokens.slice(0, index) : tokens);
  };

  Command.parse = function(tokens) {
    var nodes = tokens.slice();
    if (nodes[0] === ':' && nodes.length > 1) {
      nodes.shift();
      nodes[0] = nodes[0].toLowerCase();
    } else if (nodes[1] === ':') {
      nodes.splice(1, 1);
      nodes.unshift('new');
    } else if (nodes[1] === '.' && nodes[3] === '>>' && nodes[5] === '.') {
      nodes.splice(3, 1);
      nodes.unshift('bind');
    } else if (nodes[1] === '.' && nodes[3] === '<<') {
      nodes.splice(3, 1);
      nodes.unshift('send');
    } else if (nodes.length !== 0) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  tokens.join(' ') + '"');
    }
    if (nodes.length > 0 && Command.NAMES.indexOf(nodes[0]) === -1) {
      throw new SyntaxError('OrderScript parse error: Unexpected command "' +  tokens.join(' ') + '"');
    }
    if (nodes[0] === 'new' && (nodes.length !== 3 || !/^[a-zA-Z]/.test(nodes[1]) || !/^[a-zA-Z]/.test(nodes[2]))) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  tokens.join(' ') + '"');
    }
    if ((nodes[0] === 'bind' || nodes[0] === 'unbind') && (nodes.length !== 7 || nodes[2] !== '.' || nodes[5] !== '.')) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  tokens.join(' ') + '"');
    }
    if (nodes[0] === 'send' && (nodes.length < 4 || nodes.length > 5 || nodes[2] !== '.')) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  tokens.join(' ') + '"');
    }
    if (nodes[0] === 'delete' && (nodes.length != 2 || !/^[a-zA-Z]/.test(nodes[1]))) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  tokens.join(' ') + '"');
    }
    return nodes.filter(function(node) {
      return (node !== '.');
    }).map(function(node) {
      var first = node.charAt(0);
      var last = node.slice(-1);
      if (first === last && (first === '\'' || first === '"')) {
        node = node.slice(1, -1);
      }
      return node.replace(/\\(["'])/g, '$1');
    });
  };

  Command.NAMES = ['noop', 'new', 'bind', 'unbind', 'send', 'delete', 'reset', 'load', 'save'];

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
