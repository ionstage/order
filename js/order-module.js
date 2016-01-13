(function(window) {
  'use strict';

  var CircuitElement = window.parent.app.CircuitElement;

  var order = {};

  order.CircuitElement = function(member) {
    var self = new CircuitElement(member);
    var wrapper = {
      get: CircuitElement.prototype.get.bind(self),
      getAll: CircuitElement.prototype.getAll.bind(self)
    };

    return wrapper;
  };

  order.exports = CircuitElement.empty();

  window.order = order;

  window.addEventListener('load', function() {
    window.postMessage(window.name, location.protocol + '//' + location.host);
  });
})(this);