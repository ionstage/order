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

  ContentComponent.prototype.loadVariable = function(name, moduleName) {
    return VariableComponent.load({
      name: name,
      moduleName: moduleName,
      parentElement: this.element()
    }).then(function(variable) {
      this.variables().push(variable);
      return variable;
    }.bind(this));
  };

  ContentComponent.prototype.deleteVariable = function(name) {
    var variables = this.variables();

    for (var i = variables.length - 1; i >= 0; i--) {
      var variable = variables[i];

      if (variable.name() === name) {
        // remove DOM element of variable
        variable.parentElement(null);

        variables.splice(i, 1);

        return;
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentComponent;
  else
    app.ContentComponent = ContentComponent;
})(this.app || (this.app = {}));
