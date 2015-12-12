(function(app) {
  'use strict';

  var dom = {};

  dom.disabled = function() {
    return (typeof document === 'undefined');
  };

  dom.el = function(selector) {
    if (selector.charAt(0) === '<') {
      selector = selector.match(/<(.+)>/)[1];
      return document.createElement(selector);
    }
  };

  dom.append = function(parent, el) {
    parent.appendChild(el);
  };

  dom.animate = function(callback) {
    return window.requestAnimationFrame(callback);
  };

  dom.ajax = function(opt) {
    var type = opt.type;
    var url = opt.url;

    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();

      req.onload = function() {
        if (req.status >= 200 && req.status < 400)
          resolve(req.responseText);
        else
          reject();
      };

      req.onerror = function() {
        reject();
      };

      req.open(type, url, true);
      req.send();
    });
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = dom;
  else
    app.dom = dom;
})(this.app || (this.app = {}));