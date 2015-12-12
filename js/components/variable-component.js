(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Component = app.Component || require('./component.js');

  var VariableComponent = helper.inherits(function(props) {
    VariableComponent.super_.call(this);
    this.name = this.prop(props.name);
    this.moduleName = this.prop(props.moduleName);
    this.element = this.prop(null);
    this.parentElement = this.prop(props.parentElement);
  }, Component);

  VariableComponent.load = function(props) {
    var component = new VariableComponent(props);
    return new Promise(function(resolve) {
      var element = dom.el('<div>');
      dom.append(component.parentElement(), element);
      component.element(element);
      resolve(component);
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = VariableComponent;
  else
    app.VariableComponent = VariableComponent;
})(this.app || (this.app = {}));