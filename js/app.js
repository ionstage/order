(function(app) {
  'use strict';

  var helper = app.helper || require('./helper.js');
  var dom = app.dom || require('./dom.js');
  var Environment = app.Environment || require('./model/environment.js');
  var CommandInput = app.CommandInput || require('./components/command-input.js');
  var ContentComponent = app.ContentComponent || require('./components/content-component.js');

  var App = function() {
    helper.bindAll(this);

    this.env = new Environment({
      circuitElementFactory: this.circuitElementFactory,
      circuitElementDisposal: this.circuitElementDisposal,
      scriptLoader: this.scriptLoader,
      scriptSaver: this.scriptSaver
    });

    this.commandInput = new CommandInput({
      element: dom.el('.command-input'),
      executor: this.executor
    });

    this.contentComponent = new ContentComponent({
      element: dom.el('.content')
    });
  };

  App.prototype.circuitElementFactory = function(props) {
    return this.contentComponent.loadVariable(props.variableName, props.moduleName).then(function(variable) {
      return variable.circuitElement();
    });
  };

  App.prototype.circuitElementDisposal = function(props) {
    this.contentComponent.deleteVariable(props.variableName);
  };

  App.prototype.scriptLoader = function(filePath) {
    if (!filePath)
      throw new Error('OrderScript runtime error: Invalid script file path');

    return dom.ajax({
      type: 'GET',
      url: 'order_scripts/' + filePath
    });
  };

  App.prototype.scriptSaver = function(filePath, scriptText) {
    return dom.openWindow(filePath, '<pre>' + scriptText + '</pre>').catch(function() {
      throw new Error('OrderScript runtime error: Failed to save script');
    });
  };

  App.prototype.executor = function(text) {
    return this.env.exec(text);
  };

  app.main = new App();
})(this.app || (this.app = {}));