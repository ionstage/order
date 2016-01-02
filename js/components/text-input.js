(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Component = app.Component || require('./component.js');

  var TextInput = helper.inherits(function() {
    TextInput.super_.call(this);
  }, Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = TextInput;
  else
    app.TextInput = TextInput;
})(this.app || (this.app = {}));