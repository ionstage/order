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

  VariableComponent.prototype.render = function() {
    var element = dom.el('<div>');

    dom.addClass(element, 'variable');

    dom.html(element, [
      '<div class="variable-header">',
      '<div class="variable-name">', this.name(), '</div>',
      '<div class="variable-module-name">', this.moduleName(), '</div>',
      '</div>',
      '<iframe class="variable-content"></iframe>'
    ].join(''));

    return element;
  };

  VariableComponent.load = function(props) {
    var component = new VariableComponent(props);
    return new Promise(function(resolve, reject) {
      dom.ajax({
        type: 'GET',
        url: 'coco_modules/' + component.moduleName() + '.html'
      }).then(function(text) {
        var element = component.render();
        component.element(element);
        dom.append(component.parentElement(), element);

        var iframeElement = dom.child(element, 1);
        dom.writeContent(iframeElement, text);

        resolve(component);
      }, reject);
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = VariableComponent;
  else
    app.VariableComponent = VariableComponent;
})(this.app || (this.app = {}));