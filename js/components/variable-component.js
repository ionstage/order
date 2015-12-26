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

  VariableComponent.prototype.circuitElement = function() {
    var contentElement = dom.child(this.element(), 1);
    return helper.dig(dom.contentWindow(contentElement), 'coco', 'exports');
  };

  VariableComponent.prototype.render = function() {
    var element = dom.el('<div>');

    dom.addClass(element, 'variable');

    dom.html(element, [
      '<div class="variable-header">',
      '<div class="variable-name"></div>',
      '<div class="variable-module-name"></div>',
      '</div>',
      '<iframe class="variable-content"></iframe>'
    ].join(''));

    var headerElement = dom.child(element, 0);

    var nameElement = dom.child(headerElement, 0);
    dom.text(nameElement, this.name());

    var moduleNameElement = dom.child(headerElement, 1);
    dom.text(moduleNameElement, this.moduleName());

    return element;
  };

  VariableComponent.load = function(props) {
    var name = props.name;
    var moduleName = props.moduleName;
    var parentElement = props.parentElement;

    var moduleUrl = [
      'coco_modules/',
      moduleName.split('/').map(function(s) {
        return encodeURIComponent(s);
      }).join('/'),
      '.html'
    ].join('');

    return dom.ajax({
      type: 'GET',
      url: moduleUrl
    }).then(function(text) {
      var component = new VariableComponent({
        name: name,
        moduleName: moduleName,
        parentElement: parentElement
      });

      var element = component.render();
      component.element(element);
      dom.append(parentElement, element);

      var iframeElement = dom.child(element, 1);
      var contentWindow = dom.contentWindow(iframeElement);
      var data = Date.now().toString();

      dom.name(contentWindow, data);
      dom.writeContent(iframeElement, text);
      dom.fillContentHeight(iframeElement);

      return new Promise(function(resolve, reject) {
        dom.on(contentWindow, 'message', function(event) {
          try {
            if (event.origin !== location.origin)
              throw new Error('CocoScript runtime error: Invalid content origin');

            if (event.data !== data)
              throw new Error('CocoScript runtime error: Invalid content data');

            if (!component.circuitElement())
              throw new Error('CocoScript runtime error: Invalid circuit element');

            resolve(component);
          } catch (e) {
            dom.remove(component.element());
            component.element(null);
            reject(e);
          }
        });
      });
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = VariableComponent;
  else
    app.VariableComponent = VariableComponent;
})(this.app || (this.app = {}));