(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Component = app.Component || require('./component.js');
  var Variable = app.Variable || require('./variable.js');

  var Content = helper.inherits(function(props) {
    Content.super_.call(this);
    this.variables = this.prop([]);
    this.element = this.prop(props.element);
  }, Component);

  Content.prototype.loadVariable = function(name, moduleName) {
    return Variable.load({
      name: name,
      moduleName: moduleName,
      parentElement: this.element()
    }).then(function(variable) {
      this.variables().push(variable);
      return variable;
    }.bind(this));
  };

  Content.prototype.deleteVariable = function(name) {
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
    module.exports = Content;
  else
    app.Content = Content;
})(this.app || (this.app = {}));
