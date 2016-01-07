(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var CommandInput = helper.inherits(function(props) {
    CommandInput.super_.call(this);

    var element = props.element;
    this.element = this.prop(element);
    this.onenter = props.onenter;

    dom.on(element, 'keydown', CommandInput.onkeydown.bind(this));
  }, Component);

  CommandInput.prototype.text = function(s) {
    var element = this.element();

    if (typeof s === 'undefined')
      return element.value;

    element.value = s;
  };

  CommandInput.onkeydown = function(event) {
    if (event.which === 13)
      this.onenter();
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = CommandInput;
  else
    app.CommandInput = CommandInput;
})(this.app || (this.app = {}));