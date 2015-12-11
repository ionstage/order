(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Component = app.Component || require('./component.js');

  var VariableComponent = helper.inherits(function() {
    VariableComponent.super_.call(this);
  }, Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = VariableComponent;
  else
    app.VariableComponent = VariableComponent;
})(this.app || (this.app = {}));