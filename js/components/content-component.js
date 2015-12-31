(function(app) {
  'use strict';

  var helper = app.helper || require('../helper.js');
  var Component = app.Component || require('./component.js');

  var ContentComponent = helper.inherits(function() {
    ContentComponent.super_.call(this);
  }, Component);

  if (typeof module !== 'undefined' && module.exports)
    module.exports = ContentComponent;
  else
    app.ContentComponent = ContentComponent;
})(this.app || (this.app = {}));