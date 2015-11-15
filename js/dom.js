(function(app) {
  'use strict';

  var dom = {};

  dom.disabled = function() {
    return (typeof document === 'undefined');
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = dom;
  else
    app.dom = dom;
})(this.app || (this.app = {}));