(function(app) {
  'use strict';

  var jCore = require('jcore');
  var Variable = app.Variable || require('./variable.js');

  var Content = jCore.Component.inherits(function() {
    this.variableTable = {};
  });

  Content.prototype.loadVariable = function(name, moduleName) {
    return Variable.load({
      name: name,
      moduleName: moduleName,
      parentElement: this.element(),
    }).then(function(variable) {
      this.variableTable[name] = variable;
      return variable;
    }.bind(this));
  };

  Content.prototype.deleteVariable = function(name) {
    this.variableTable[name].parentElement(null);
    delete this.variableTable[name];
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Content;
  } else {
    app.Content = Content;
  }
})(this.app || (this.app = {}));
