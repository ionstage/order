(function(window) {
  'use strict';

  var CircuitModule = window.parent.app.CircuitModule;

  var order = {};

  order.Module = function(member) {
    var self = new CircuitModule(member);
    var wrapper = {
      get: CircuitModule.prototype.get.bind(self),
      getAll: CircuitModule.prototype.getAll.bind(self)
    };

    return wrapper;
  };

  order.exports = CircuitModule.empty();

  window.order = order;
})(this);
