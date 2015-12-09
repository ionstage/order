(function(app) {
  'use strict';

  var helper = {};

  helper.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });

    return ctor;
  };

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