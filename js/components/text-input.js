(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Component = app.Component || require('./component.js');

  var TextInput = helper.inherits(function(props) {
    TextInput.super_.call(this);
    this.element = this.prop(props.element);
  }, Component);

  TextInput.prototype.text = function(s) {
    var element = this.element();

    if (typeof s === 'undefined')
      return element.value;

    element.value = s;
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = TextInput;
  else
    app.TextInput = TextInput;
})(this.app || (this.app = {}));