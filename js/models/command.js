(function(app) {
  'use strict';

  var command = {};

  command.parseLine = function(line) {
    line = line.split('#')[0].trim();

    if (!line)
      return [];
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = command;
  else
    app.command = command;
})(this.app || (this.app = {}));