(function(app) {
  'use strict';

  var dom = {};

  dom.unsupported = function() {
    return (typeof document === 'undefined');
  };

  dom.el = function(selector) {
    if (selector.charAt(0) === '<') {
      selector = selector.match(/<(.+)>/)[1];
      return document.createElement(selector);
    }

    return document.querySelector(selector);
  };

  dom.append = function(parent, el) {
    parent.appendChild(el);
  };

  dom.remove = function(el) {
    el.parentNode.removeChild(el);
  };

  dom.child = function(el, index) {
    return el.childNodes[index];
  };

  dom.attr = function(el, props) {
    Object.keys(props).forEach(function(key) {
      el.setAttribute(key, props[key]);
    });
  };

  dom.css = function(el, props) {
    var style = el.style;
    Object.keys(props).forEach(function(key) {
      style[key] = props[key];
    });
  };

  dom.addClass = function(el, className) {
    el.classList.add(className);
  };

  dom.name = function(el, s) {
    el.name = s;
  };

  dom.text = function(el, s) {
    el.textContent = s;
  };

  dom.html = function(el, s) {
    el.innerHTML = s;
  };

  dom.value = function(el, s) {
    if (typeof s === 'undefined')
      return el.value;

    el.value = s;
  };

  dom.disabled = function(el, disabled) {
    el.disabled = disabled;
  };

  dom.focus = function(el) {
    el.focus();
  };

  dom.contentWindow = function(iframe) {
    return iframe.contentWindow;
  };

  dom.writeContent = function(iframe, s) {
    var doc = iframe.contentDocument;
    doc.open();
    doc.write(s);
    doc.close();
  };

  dom.contentHeight = function(iframe) {
    return iframe.contentDocument.documentElement.scrollHeight;
  };

  dom.openWindow = function(title, content) {
    return new Promise(function(resolve, reject) {
      var win = window.open();

      if (win) {
        var doc = win.document;

        doc.open();
        doc.write(content);
        doc.close();

        doc.title = title;

        resolve();
      } else {
        reject();
      }
    });
  };

  dom.animate = function(callback) {
    return window.requestAnimationFrame(callback);
  };

  dom.on = function(el, type, listener) {
    el.addEventListener(type, listener);
  };

  dom.off = function(el, type, listener) {
    el.removeEventListener(type, listener);
  };

  dom.once = function(el, type, listener) {
    var wrapper = function() {
      dom.off(el, type, wrapper);
      listener.apply(null, arguments);
    };
    dom.on(el, type, wrapper);
  };

  dom.ajax = function(opt) {
    var type = opt.type;
    var url = opt.url;

    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();

      var onfailed = function() {
        reject(new Error('Failed to load resource: ' + type + ' ' + url));
      };

      req.onload = function() {
        if (req.status >= 200 && req.status < 400)
          resolve(req.responseText);
        else
          onfailed();
      };

      req.onerror = onfailed;
      req.onabort = onfailed;

      req.open(type, url, true);
      req.send();
    });
  };

  dom.origin = function() {
    return location.protocol + '//' + location.host;
  };

  dom.load = function(key, defaultValue) {
    var value = localStorage.getItem(key);

    if (value === null && typeof defaultValue !== 'undefined')
      return defaultValue;

    return JSON.parse(value);
  };

  dom.save = function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = dom;
  else
    app.dom = dom;
})(this.app || (this.app = {}));
