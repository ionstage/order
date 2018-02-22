(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var CommandInput = jCore.Component.inherits(function(props) {
    this.executor = props.executor;
    this.historyLoader = props.historyLoader;
    this.historySaver = props.historySaver;
    this.history = new CommandInput.History();

    this.loadHistory().then(function() {
      this.focus();
    }.bind(this));

    dom.on(this.element(), 'keydown', CommandInput.prototype.onkeydown.bind(this));
  });

  CommandInput.prototype.text = function(s) {
    return dom.value(this.element(), s);
  };

  CommandInput.prototype.disabled = function(disabled) {
    dom.disabled(this.element(), disabled);
  };

  CommandInput.prototype.focus = function() {
    dom.focus(this.element());
  };

  CommandInput.prototype.onkeydown = function(event) {
    var key = CommandInput.keyMap[event.which];

    if (key) {
      this['on' + key](event);
    }
  };

  CommandInput.prototype.onenter = function() {
    var text = this.text();

    if (!text) {
      return;
    }

    Promise.resolve().then(function() {
      this.disabled(true);
      return this.executor(text);
    }.bind(this)).then(function() {
      this.history.push(text);
      this.saveHistory();
      // clear input text
      this.text('');
      this.disabled(false);
      this.focus();
    }.bind(this)).catch(function(e) {
      console.error(e);
      this.disabled(false);
      this.focus();
    }.bind(this));
  };

  CommandInput.prototype.onup = function(event) {
    event.preventDefault();
    this.text(this.history.back());
  };

  CommandInput.prototype.ondown = function(event) {
    event.preventDefault();
    this.text(this.history.forward());
  };

  CommandInput.prototype.loadHistory = function() {
    this.disabled(true);

    return this.historyLoader().then(function(data) {
      this.history.set(data);
      this.disabled(false);
    }.bind(this)).catch(function() {
      this.disabled(false);
    }.bind(this));
  };

  CommandInput.prototype.saveHistory = function() {
    this.historySaver(this.history.get());
  };

  CommandInput.keyMap = {
    13: 'enter',
    38: 'up',
    40: 'down',
  };

  CommandInput.History = (function() {
    var History = function() {
      this.data = [];
      this.index = 0;
      this.size = 100;
    };

    History.prototype.back = function() {
      this.index = Math.max(this.index - 1, 0);
      return this.current();
    };

    History.prototype.forward = function() {
      this.index = Math.min(this.index + 1, this.data.length);
      return this.current();
    };

    History.prototype.push = function(text) {
      this.data = this.data.slice(-this.size - 1);
      this.data.push(text);
      this.index = this.data.length;
    };

    History.prototype.current = function() {
      return this.data[this.index] || '';
    };

    History.prototype.get = function() {
      return this.data;
    };

    History.prototype.set = function(data) {
      this.data = data.slice(-this.size);
      this.index = this.data.length;
    };

    return History;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommandInput;
  } else {
    app.CommandInput = CommandInput;
  }
})(this.app || (this.app = {}));
