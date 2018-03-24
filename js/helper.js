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
        configurable: true,
      },
    });

    return ctor;
  };

  helper.values = function(obj) {
    return Object.keys(obj).map(function(key) {
      return obj[key];
    });
  };

  helper.remove = function(array, item) {
    var index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
  };

  helper.find = function(array, callback) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (callback(array[i], i, array)) {
        return array[i];
      }
    }
    return null;
  };

  helper.List = (function() {
    var List = function() {
      this.data = [];
    };

    List.prototype.add = function(item) {
      if (!this.contains(item)) {
        this.data.push(item);
      }
    };

    List.prototype.remove = function(item) {
      var data = this.data;

      for (var i = data.length - 1; i >= 0; i--) {
        if (this.equal(data[i], item)) {
          data.splice(i, 1);
          break;
        }
      }
    };

    List.prototype.contains = function(item) {
      return this.data.some(function(dataItem) {
        return this.equal(dataItem, item);
      }.bind(this));
    };

    List.prototype.equal = function(a, b) {
      return a === b;
    };

    List.prototype.toArray = function() {
      return this.data.slice();
    };

    return List;
  })();

  helper.capitalize = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  helper.wrapper = function() {
    var Wrapper = function(self, wrapper) {
      return Object.defineProperty(wrapper, 'unwrap', { value: Wrapper.unwrap.bind(self) });
    };

    Wrapper.unwrap = function(key) {
      return (key === Wrapper.KEY ? this : null);
    };

    Wrapper.KEY = {};

    return Wrapper;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = helper;
  } else {
    app.helper = helper;
  }
})(this.app || (this.app = {}));
