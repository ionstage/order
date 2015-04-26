(function(window) {
  'use strict';
  var document = window.document;

  function ready(fn) {
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'complete')
          fn();
      });
    }
  }

  function addEventListener(el, eventName, handler) {
    if (el.addEventListener) {
      el.addEventListener(eventName, handler);
    } else {
      el.attachEvent('on' + eventName, function(){
        var e = window.event;
        e.target = e.srcElement;
        e.currentTarget = el;
        handler.call(el, e);
      });
    }
  }

  var piece = (function() {
    var _propData;
    var _eventData;
    var isInitialized = false;
    var isDOMContentloaded = false;
    ready(function() {
      isDOMContentloaded = true;
    });
    var pieceID = null;
    function createPropData(data) {
      if (!data)
        return null;
      var propData = {};
      for (var target in data) {
        var srcData = data[target];
        var destData = {label: srcData.label};
        if (typeof srcData['in'] === 'function')
          destData['in'] = true;
        if (typeof srcData.out === 'function') {
          destData.out = true;
          destData.data = srcData.out();
        }
        if (srcData['default'] === true)
          destData['default'] = true;
        if (srcData.serialize === true)
          destData.serialize = true;
        propData[target] = destData;
      }
      return propData;
    }
    function createEventData(data) {
      if (!data)
        return null;
      var eventData = {};
      for (var target in data) {
        var srcData = data[target];
        var destData = {label: srcData.label};
        if (typeof srcData['in'] === 'function')
          destData['in'] = true;
        if (typeof srcData.out === 'function')
          destData.out = true;
        if (srcData['default'] === true)
          destData['default'] = true;
        eventData[target] = destData;
      }
      return eventData;
    }
    function setWindowMessageEvent() {
      var propData = _propData, eventData = _eventData;
      addEventListener(window, 'message', function(event) {
        try {
          var data = JSON.parse(event.data);
        } catch (e) {
          return;
        }
        var type = data.type;
        var target = data.target;
        switch (type) {
          case 'prop':
            if (target in propData && typeof propData[target]['in'] === 'function')
              propData[target]['in'].apply(propData[target], data.data);
            break;
          case 'event':
            if (target in eventData && typeof eventData[target]['in'] === 'function')
              eventData[target]['in']();
            break;
          default:
            break;
        }
      }, false);
    }
    function postMessageToParent(data) {
      var sendData = {
        id: pieceID,
        type: 'load',
        data: {
          label: data.label || ''
        }
      };
      var componentHeight = document.body.clientHeight + 'px';
      sendData.data.componentHeight = componentHeight;
      _propData = data.prop;
      var propData = createPropData(data.prop);
      if (propData)
        sendData.data.prop = propData;
      _eventData = data.event;
      var eventData = createEventData(data.event);
      if (eventData)
        sendData.data.event = eventData;
      setWindowMessageEvent();
      window.parent.postMessage(JSON.stringify(sendData), '*');
    }
    function initialize(data) {
      if (isInitialized)
        return;
      isInitialized = true;
      pieceID = location.hash.substring(1);
      if (!pieceID)
        return;
      if (isDOMContentloaded)
        postMessageToParent(data);
      else
        ready(function() {
          postMessageToParent(data);
        });
    }
    function updateProperty(target) {
      var propData = _propData;
      if (target in propData && typeof propData[target].out === 'function') {
        window.parent.postMessage(JSON.stringify({
          id: pieceID,
          type: 'prop',
          target: target,
          data: propData[target].out()
        }), '*');
      }
    }
    function dispatchEvent(target) {
      var eventData = _eventData;
      if (target in eventData && typeof eventData[target].out === 'function') {
        window.parent.postMessage(JSON.stringify({
          id: pieceID,
          type: 'event',
          target: target,
          data: eventData[target].out()
        }), '*');
      }
    }
    return {
      initialize: initialize,
      updateProperty: updateProperty,
      dispatchEvent: dispatchEvent,
      noop: function() {}
    };
  }());
  window.piece = piece;
}(this));