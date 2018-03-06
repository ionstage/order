(function(app) {
  'use strict';

  var jCore = require('jcore');

  var FileInput = jCore.Component.inherits();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileInput;
  } else {
    app.FileInput = FileInput;
  }
})(this.app || (this.app = {}));
