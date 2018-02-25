(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var Environment = app.Environment || require('../models/environment.js');
  var CommandInput = app.CommandInput || require('./command-input.js');
  var Content = app.Content || require('./content.js');

  var Main = jCore.Component.inherits(function() {
    helper.bindAll(this);

    this.env = new Environment({
      circuitModuleFactory: this.circuitModuleFactory,
      circuitModuleDisposal: this.circuitModuleDisposal,
      scriptLoader: this.scriptLoader,
      scriptSaver: this.scriptSaver,
    });

    this.commandInput = new CommandInput({
      element: this.findElement('.command-input'),
    });

    this.content = new Content({
      element: this.findElement('.content'),
    });
  });

  Main.prototype.circuitModuleFactory = function(props) {
    return this.content.loadVariable(props.variableName, props.moduleName).then(function(variable) {
      return variable.circuitModule();
    });
  };

  Main.prototype.circuitModuleDisposal = function(props) {
    this.content.deleteVariable(props.variableName);
  };

  Main.prototype.scriptLoader = function(filePath) {
    if (!filePath) {
      throw new Error('OrderScript runtime error: Invalid script file path');
    }

    return dom.ajax({
      type: 'GET',
      url: 'order_scripts/' + filePath,
    });
  };

  Main.prototype.scriptSaver = function(filePath, scriptText) {
    return dom.openWindow(filePath, '<pre>' + scriptText + '</pre>').catch(function() {
      throw new Error('OrderScript runtime error: Failed to save script');
    });
  };

  Main.prototype.oninit = function() {
    this.commandInput.on('exec', this.onexec.bind(this));
  };

  Main.prototype.onexec = function(text, done) {
    this.env.exec(text).then(function() {
      done();
    }).catch(function(e) {
      console.error(e);
      done(e);
    });
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Main;
  } else {
    app.Main = Main;
  }
})(this.app || (this.app = {}));
