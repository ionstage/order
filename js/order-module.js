(function(window) {
  'use strict';

  Object.defineProperty(window, 'order', {
    value: Object.create(Object.prototype, {
      Module: { value: window.parent.CircuitModule },
      exports: { value: null, writable: true },
    }),
  });
})(this);
