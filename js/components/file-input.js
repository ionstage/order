(function(app) {
  'use strict';

  var jCore = require('jcore');
  var dom = app.dom || require('../dom.js');

  var FileInput = jCore.Component.inherits();

  FileInput.prototype.load = function() {
    return new Promise(function(resolve) {
      dom.click(this.element());
      dom.once(this.element(), 'change', function(event) {
        resolve(dom.file(dom.target(event)));
      });
    }.bind(this)).then(function(file) {
      dom.value(this.element(), '');
      return dom.readFile(file);
    }.bind(this));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileInput;
  } else {
    app.FileInput = FileInput;
  }
})(this.app || (this.app = {}));
