(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Component = app.Component || require('./component.js');
  var VariableComponent = app.VariableComponent || require('./variable-component.js');

  var ContentComponent = helper.inherits(function(props) {
    ContentComponent.super_.call(this);
    this.variables = this.prop([]);
    this.element = this.prop(props.element);
  }, Component);

  ContentComponent.prototype.circuitElementFactory = function(props) {
    return VariableComponent.load({
      name: props.variableName,
      moduleName: props.moduleName,
      parentElement: this.element()
    }).then(function(component) {
      this.variables().push(component);
      return component.circuitElement();
    }.bind(this));
  };

  ContentComponent.prototype.deleteVariable = function(name) {
    var variables = this.variables();

    var variable = variables.filter(function(variable) {
      return variable.name() === name;
    })[0];

    if (!variable)
      return;

    // remove DOM element of variable
    variable.parentElement(null);

    variables.splice(variables.indexOf(variable), 1);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentComponent;
  else
    app.ContentComponent = ContentComponent;
})(this.app || (this.app = {}));