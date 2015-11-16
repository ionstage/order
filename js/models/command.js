(function(app) {
  'use strict';

  var command = {};

  if (typeof module !== 'undefined' && module.exports)
    module.exports = command;
  else
    app.command = command;
})(this.app || (this.app = {}));