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
    if (nodes[0] === 'delete' && (nodes.length !== 2 || !/^[a-zA-Z]/.test(nodes[1]))) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  tokens.join(' ') + '"');
    }
    if (nodes[0] === 'reset' && nodes.length !== 1) {
      throw new SyntaxError('OrderScript parse error: Unexpected identifier "' +  tokens.join(' ') + '"');
    }
    if ((nodes[0] === 'load' || nodes[0] === 'save') && nodes.length > 2) {
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

  Command.NAMES = ['new', 'bind', 'unbind', 'send', 'delete', 'reset', 'load', 'save'];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Command;
  } else {
    app.Command = Command;
  }
})(this.app || (this.app = {}));
