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

  dom.child = function(el, index) {
    return el.childNodes[index];
  };

  dom.addClass = function(el, className) {
    el.classList.add(className);
  };

  dom.html = function(el, s) {
    el.innerHTML = s;
  };

  dom.writeContent = function(iframe, s) {
    var doc = iframe.contentDocument;
    doc.open();
    doc.write(s);
    doc.close();
  };

  dom.fillContentHeight = function(iframe) {
    iframe.style.height = iframe.contentDocument.documentElement.scrollHeight + 'px';
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