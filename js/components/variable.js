(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitModule = app.CircuitModule || require('../models/circuit-module.js');

  var Variable = jCore.Component.inherits(function(props) {
    this.name = this.prop(props.name);
    this.moduleName = this.prop(props.moduleName);
  });

  Variable.prototype.nameElement = function() {
    return this.findElement('.variable-name');
  };

  Variable.prototype.moduleNameElement = function() {
    return this.findElement('.variable-module-name');
  };

  Variable.prototype.contentUrl = function() {
    return 'order_modules/' + encodeURI(this.moduleName()) + '.html';
  };

  Variable.prototype.circuitModule = function() {
    var contentElement = dom.child(this.element(), 1);
    var circuitModule = helper.dig(dom.contentWindow(contentElement), 'order', 'exports');
    return circuitModule || CircuitModule.empty();
  };

  Variable.prototype.render = function() {
    return dom.render(Variable.HTML_TEXT);
  };

  Variable.prototype.oninit = function() {
    dom.text(this.nameElement(), this.name());
    dom.text(this.moduleNameElement(), this.moduleName());
  };

  Variable.prototype.load = function() {
    var contentElement = this.findElement('.variable-content');
    return new Promise(function(resolve, reject) {
      var timeoutID = setTimeout(reject, 30 * 1000, new Error('OrderScript runtime error: Load timeout for content'));
      dom.once(contentElement, 'load', function() {
        clearTimeout(timeoutID);
        resolve(this.circuitModule());
      }.bind(this));
      dom.attr(contentElement, { src: this.contentUrl() });
    }.bind(this)).then(function(circuitModule) {
      if (!circuitModule) {
        throw new Error('OrderScript runtime error: Invalid circuit module');
      }
      dom.css(contentElement, { height: dom.contentHeight(contentElement) + 'px' });
    });
  };

  Variable.HTML_TEXT = [
    '<div class="variable">',
      '<div class="variable-header">',
        '<div class="variable-name"></div>',
        '<div class="variable-module-name"></div>',
      '</div>',
      '<iframe class="variable-content"></iframe>',
    '</div>',
  ].join('');

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Variable;
  else
    app.Variable = Variable;
})(this.app || (this.app = {}));
