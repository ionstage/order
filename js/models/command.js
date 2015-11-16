(function(app) {
  'use strict';

  var command = {};

  command.parseLine = function(line) {
    if (line === '')
      return [];
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = command;
  else
    app.command = command;
})(this.app || (this.app = {}));