(function(app) {
  'use strict';

  var helper = {};

  helper.identity = function(value) {
    return value;
  };

  helper.capitalize = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = helper;
  else
    app.helper = helper;
})(this.app || (this.app = {}));