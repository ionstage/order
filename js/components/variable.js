(function(app) {
  'use strict';

  var jCore = require('jcore');
  var helper = app.helper || require('../helper.js');
  var dom = app.dom || require('../dom.js');
  var CircuitElement = app.CircuitElement || require('../models/circuit-element.js');

  var Variable = jCore.Component.inherits(function(props) {
    this.name = this.prop(props.name);
    this.moduleName = this.prop(props.moduleName);
  });

  Variable.prototype.contentUrl = function() {
    return 'order_modules/' + encodeURI(this.moduleName()) + '.html';
  };

  Variable.prototype.circuitElement = function() {
    var contentElement = dom.child(this.element(), 1);
    var circuitElement = helper.dig(dom.contentWindow(contentElement), 'order', 'exports');
    return circuitElement || CircuitElement.empty();
  };

  Variable.prototype.render = function() {
    var element = dom.el('<div>');

    dom.addClass(element, 'variable');

    dom.html(element, [
      '<div class="variable-header">',
      '<div class="variable-name"></div>',
      '<div class="variable-module-name"></div>',
      '</div>',
      '<iframe class="variable-content"></iframe>'
    ].join(''));

    return element;
  };

  Variable.prototype.onredraw = function() {
    var headerElement = dom.child(this.element(), 0);

    var nameElement = dom.child(headerElement, 0);
    dom.text(nameElement, this.name());

    var moduleNameElement = dom.child(headerElement, 1);
    dom.text(moduleNameElement, this.moduleName());
  };

  Variable.prototype.load = function() {
    return dom.ajax({
      type: 'GET',
      url: this.contentUrl(),
    }).then(function(text) {
      var element = this.element();
      var contentElement = dom.child(element, 1);
      var contentWindow = dom.contentWindow(contentElement);
      var data = Date.now().toString();

      dom.name(contentWindow, data);
      dom.writeContent(contentElement, text);
      dom.css(contentElement, { height: dom.contentHeight(contentElement) + 'px' });

      var onmessage;

      return Promise.race([
        new Promise(function(resolve, reject) {
          onmessage = function(event) {
            try {
              if (event.origin !== dom.origin())
                throw new Error('OrderScript runtime error: Invalid content origin');

              if (event.data !== data)
                throw new Error('OrderScript runtime error: Invalid content data');

              if (!this.circuitElement())
                throw new Error('OrderScript runtime error: Invalid circuit element');

              resolve(this);
            } catch (e) {
              dom.remove(this.element());
              this.element(null);
              reject(e);
            }
          }.bind(this);

          dom.on(contentWindow, 'message', onmessage);
        }.bind(this)),
        new Promise(function(resolve, reject) {
          setTimeout(reject, 30 * 1000, new Error('OrderScript runtime error: Load timeout for content'));
        })
      ]).then(function(component) {
        dom.off(contentWindow, 'message', onmessage);
        return component;
      }).catch(function(e) {
        dom.off(contentWindow, 'message', onmessage);
        throw e;
      });
    }.bind(this));
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Variable;
  else
    app.Variable = Variable;
})(this.app || (this.app = {}));
