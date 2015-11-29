(function(app) {
  'use strict';
  var command = app.command || require('./command.js');

  var Environment = function() {};

  Environment.prototype.exec = function(s) {
    return new Promise(function(resolve, reject) {
      var cmd = command.parseStatement(s);

      if (cmd instanceof command.Noop)
        resolve();
      else
        reject();
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = Environment;
  else
    app.Environment = Environment;
})(this.app || (this.app = {}));