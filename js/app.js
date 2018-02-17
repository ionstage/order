(function(app) {
  'use strict';

  var Main = app.Main || require('./components/main.js');

  app.main = new Main();

  if (typeof module !== 'undefined' && module.exports) {
    app.CircuitModule = require('./models/circuit-module.js');
    global.app = app;
  }
})(this.app || (this.app = {}));
