(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var CommandInput = jCore.Component.inherits(function(props) {
    this.history = new CommandInput.History();
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

  CommandInput.prototype.done = function(error) {
    if (!error) {
      this.history.push(this.text());
      this.history.save();

      // clear input text
      this.text('');
    }
    this.disabled(false);
    this.focus();
  };

  CommandInput.prototype.oninit = function() {
    this.history.load();
    this.focus();
    dom.on(this.element(), 'keydown', this.onkeydown.bind(this));
  };

  CommandInput.prototype.onkeydown = function(event) {
    var key = CommandInput.keyMap[event.which];

    if (key) {
      this['on' + key](event);
    }
  };

  CommandInput.prototype.onenter = function() {
    var text = this.text();
    if (text) {
      this.disabled(true);
      this.emit('exec', text, this.done.bind(this));
    }
  };

  CommandInput.prototype.onup = function(event) {
    event.preventDefault();
    this.text(this.history.back());
  };

  CommandInput.prototype.ondown = function(event) {
    event.preventDefault();
    this.text(this.history.forward());
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
      this.key = 'order/input-history';
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
      this.data.push(text);
      this.data.splice(0, this.data.length - this.size);
      this.index = this.data.length;
    };

    History.prototype.current = function() {
      return this.data[this.index] || '';
    };

    History.prototype.load = function() {
      this.data = dom.load(this.key, []);
      this.index = this.data.length;
    };

    History.prototype.save = function() {
      dom.save(this.key, this.data);
    };

    return History;
  })();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommandInput;
  } else {
    app.CommandInput = CommandInput;
  }
})(this.app || (this.app = {}));
