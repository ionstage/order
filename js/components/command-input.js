(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var CommandInput = helper.inherits(function(props) {
    CommandInput.super_.call(this);

    var element = props.element;
    this.element = this.prop(element);
    this.executor = props.executor;

    dom.on(element, 'keydown', CommandInput.prototype.onkeydown.bind(this));
  }, Component);

  CommandInput.prototype.text = function(s) {
    var element = this.element();

    if (typeof s === 'undefined')
      return element.value;

    element.value = s;
  };

  CommandInput.prototype.onkeydown = function(event) {
    if (event.which === 13)
      this.onenter();
  };

  CommandInput.prototype.onenter = function() {
    Promise.resolve().then(function() {
      return this.executor(this.text());
    }.bind(this)).then(function() {
      // clear input text
      this.text('');
    }.bind(this)).catch(function(e) {
      console.error(e);
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CommandInput;
  else
    app.CommandInput = CommandInput;
})(this.app || (this.app = {}));