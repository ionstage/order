(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var InputHistory = function() {
    this.data = [];
    this.index = 0;
  };

  InputHistory.prototype.back = function() {
    this.index = Math.max(this.index - 1, 0);
    return this.current();
  };

  InputHistory.prototype.forward = function() {
    this.index = Math.min(this.index + 1, this.data.length);
    return this.current();
  };

  InputHistory.prototype.push = function(text) {
    this.data.push(text);
    this.index = this.data.length;
  };

  InputHistory.prototype.current = function() {
    return this.data[this.index] || '';
  };

  var CommandInput = helper.inherits(function(props) {
    CommandInput.super_.call(this);

    var element = props.element;
    this.element = this.prop(element);
    this.executor = props.executor;
    this.inputHistory = new InputHistory();

    dom.on(element, 'keydown', CommandInput.prototype.onkeydown.bind(this));
  }, Component);

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

    if (key)
      this['on' + key](event);
  };

  CommandInput.prototype.onenter = function() {
    var text = this.text();

    if (!text)
      return;

    Promise.resolve().then(function() {
      this.disabled(true);
      return this.executor(text);
    }.bind(this)).then(function() {
      this.inputHistory.push(text);
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
    this.text(this.inputHistory.back());
  };

  CommandInput.prototype.ondown = function(event) {
    event.preventDefault();
    this.text(this.inputHistory.forward());
  };

  CommandInput.keyMap = {
    13: 'enter',
    38: 'up',
    40: 'down'
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CommandInput;
  else
    app.CommandInput = CommandInput;
})(this.app || (this.app = {}));