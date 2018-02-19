(function(app) {
  'use strict';

  var dom = app.dom || require('./dom.js');
  var CircuitModule = app.CircuitModule || require('./models/circuit-module.js');
  var Main = app.Main || require('./components/main.js');

  dom.export('CircuitModule', CircuitModule);
  app.main = new Main();
})(this.app || (this.app = {}));
