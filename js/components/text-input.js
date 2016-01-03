(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var TextInput = helper.inherits(function(props) {
    TextInput.super_.call(this);

    var element = props.element;
    this.element = this.prop(element);
    this.onenter = props.onenter;

    dom.on(element, 'keydown', TextInput.onkeydown.bind(this));
  }, Component);

  TextInput.prototype.text = function(s) {
    var element = this.element();

    if (typeof s === 'undefined')
      return element.value;

    element.value = s;
  };

  TextInput.onkeydown = function(event) {
    if (event.which === 13)
      this.onenter();
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = TextInput;
  else
    app.TextInput = TextInput;
})(this.app || (this.app = {}));