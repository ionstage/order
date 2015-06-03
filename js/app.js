var app = app || {};

(function($) {
  'use strict';
  var userAgent = navigator.userAgent;
  var isIE = userAgent.match(/MSIE/) || userAgent.match(/Trident/);

  app.variables = {};

  var command = {
    empty: {
      parse: function(line) {
        if (line === '')
          return {};
      },
      exec: function(option, variables) {
        return $.Deferred().resolve().promise();
      }
    },
    comment: {
      parse: function(line) {
        if (line.charAt(0) === '#')
          return {};
      },
      exec: function(option, variables) {
        return $.Deferred().resolve().promise();
      }
    },
    declare: {
      parse: function(line) {
        var m = line.match(/^([^:]+):([^:]+)$/);
        if (!m || m.length !== 3)
          return;
        return {
          variableName: m[1],
          className: m[2]
        };
      },
      exec: function(option, variables) {
        var variableName = option.variableName;

        if (variableName in variables)
          return $.Deferred().reject().promise();

        var variable = createModule(variableName, option.className);
        variables[variableName] = variable;
        variable.variables = variables;

        return activateModule(variableName, variable);
      }
    },
    connect: {
      parse: function(line) {
        var m = line.match(/^([^:]+?)[\s]*([=|-])>[\s]*([^:]+)$/);
        if (!m || m.length !== 4)
          return;
        var source = m[1].split('.');
        var target = m[3].split('.');
        if (source.length !== 2 || target.length !== 2)
          return;
        return {
          connectType: (m[2] === '=') ? 'prop' : 'event',
          source: {
            name: source[0],
            target: source[1]
          },
          target: {
            name: target[0],
            target: target[1]
          }
        };
      },
      exec: function(option, variables) {
        var deferred = $.Deferred();
        var source = option.source
        var target = option.target;
        var sourceVar = variables[source.name];
        var targetVar = variables[target.name];

        if (!sourceVar || !targetVar) {
          deferred.reject();
          return deferred.promise();
        }

        var connectType = option.connectType;
        var sourceCel = sourceVar.cel[connectType][source.target];
        var targetCel = targetVar.cel[connectType][target.target];

        if (circuit.connect(sourceCel, targetCel)) {
          var $el = createConnectionElement(connectType, source, target);
          $('#connection-list .container').append($el);
          deferred.resolve();
        } else {
          deferred.reject();
        }

        return deferred.promise();
      }
    },
    load: {
      parse: function(line) {
        var m = line.match(/^:load[\s]*(.*)$/);
        if (!m || m.length !== 2)
          return;
        return {
          src: m[1]
        };
      },
      exec: function(option, variables) {
        var deferred = $.Deferred();

        $.ajax({
          url: 'coco_scripts/' + option.src,
          dataType: 'text',
          cache: false
        }).done(function(data) {
          var commands = data.split('\n');
          (function doCommands(index) {
            var command = commands[index];
            app.execCommand(command, variables)
                .done(function() {
                  index += 1;
                  if (index < commands.length)
                    doCommands(index);
                  else
                    deferred.resolve();
                }).fail(function() {
                  alert('error: L' + (index + 1) + ', ' + command);
                  deferred.reject();
                });
          }(0));
        }).fail(function() {
          deferred.reject();
        });

        return deferred.promise();
      }
    },
    update: {
      parse: function(line) {
        var m = line.match(/^(.+)[\s]*=>[\s]*([^:]+)$/);
        if (!m || m.length !== 3)
          return;
        var value = $.trim(m[1]);
        var vm = value.match(/^"(.*)"$/);
        if (vm) {
          value = vm[1];
        } else {
          try {
            value = JSON.parse(value);
          } catch (e) {
            return;
          }
        }
        var target = m[2].split('.');
        if (target.length !== 2)
          return;
        return {
          value: value,
          target: {
            name: target[0],
            target: target[1]
          }
        };
      },
      exec: function(option, variables) {
        var deferred = $.Deferred();
        var target = app.variables[option.target.name];

        if (!target) {
          deferred.reject();
          return deferred.promise();
        }

        var value = option.value;
        var targetFunc = target.cel.prop[option.target.target]['in'];
        if (typeof targetFunc === 'function') {
          targetFunc(value);
          deferred.resolve();
        } else {
          deferred.reject();
        }

        return deferred.promise();
      }
    },
    dispatch: {
      parse: function(line) {
        var m = line.match(/^->[\s]*([^:]+)$/);
        if (!m || m.length !== 2)
          return;
        var target = m[1].split('.');
        if (target.length !== 2)
          return;
        return {
          target: {
            name: target[0],
            target: target[1]
          }
        };
      },
      exec: function(option, variables) {
        var deferred = $.Deferred();
        var target = variables[option.target.name];

        if (!target) {
          deferred.reject();
          return deferred.promise();
        }

        var targetFunc = target.cel.event[option.target.target]['in'];
        if (typeof targetFunc === 'function') {
          targetFunc();
          deferred.resolve();
        } else {
          deferred.reject();
        }

        return deferred.promise();
      }
    },
    disconnect: {
      parse: function(line) {
        var m = line.match(/^([^:]+?)[\s]*([=|-])\/>[\s]*([^:]+)$/);
        if (!m || m.length !== 4)
          return;
        var source = m[1].split('.');
        var target = m[3].split('.');
        if (source.length !== 2 || target.length !== 2)
          return;
        return {
          connectType: (m[2] === '=') ? 'prop' : 'event',
          source: {
            name: source[0],
            target: source[1]
          },
          target: {
            name: target[0],
            target: target[1]
          }
        };
      },
      exec: function(option, variables) {
        var deferred = $.Deferred();
        var source = option.source
        var target = option.target;
        var sourceVar = variables[source.name];
        var targetVar = variables[target.name];

        if (!sourceVar || !targetVar) {
          deferred.reject();
          return deferred.promise();
        }

        var connectType = option.connectType;
        var sourceCel = sourceVar.cel[connectType][source.target];
        var targetCel = targetVar.cel[connectType][target.target];

        if (circuit.disconnect(sourceCel, targetCel)) {
          $('#connection-list .container').children().each(function(index, element) {
            var $element = $(element);
            if ($element.text() === createConnectionText(connectType, source, target))
              $element.remove();
          });
          deferred.resolve();
        } else {
          deferred.reject();
        }

        return deferred.promise();
      }
    },
    'delete': {
      parse: function(line) {
        var m = line.match(/^\/\/[\s]*([^:]+)$/);
        if (!m || m.length !== 2)
          return;
        return {
          variableName: m[1]
        };
      },
      exec: function(option, variables) {
        var deferred = $.Deferred();
        var variableName = option.variableName;

        if (!(variableName in variables)) {
          deferred.reject();
          return deferred.promise();
        }

        var variable = variables[variableName];
        variable.$el.remove();
        $('#connection-list .container').children().each(function(index, element) {
          var $element = $(element);
          var command = $element.text();
          var m = command.match(/^([^:]+?)[\s]*([=|-])>[\s]*([^:]+)$/);
          if (m && m.length === 4) {
            var source = m[1].split('.');
            var target = m[3].split('.');
            if (source[0] === variableName || target[0] === variableName) {
              var sourceVar = variables[source[0]];
              var targetVar = variables[target[0]];
              var connectType = (m[2] === '=') ? 'prop' : 'event';
              var sourceCel = sourceVar.cel[connectType][source[1]];
              var targetCel = targetVar.cel[connectType][target[1]];
              circuit.disconnect(sourceCel, targetCel);
              $element.remove();
            }
          }
        });
        delete variables[variableName];

        deferred.resolve();
        return deferred.promise();
      }
    },
    clear: {
      parse: function(line) {
        var m = line.match(/^:clear$/);
        if (m)
          return {};
      },
      exec: function(option, variables) {
        var deferred = $.Deferred();

        for (var key in variables) {
          var variable = variables[key];
          variable.$el.remove();
          delete variables[key];
        }

        $('#module-list .container').empty();
        $('#connection-list .container').empty();

        deferred.resolve();
        return deferred.promise();
      }
    },
    save: {
      parse: function(line) {
        var m = line.match(/^:save$/);
        if (m)
          return {};
      },
      exec: function(option, variables) {
        var deferred = $.Deferred();
        var codeText = '';

        for (var key in variables) {
          var variable = variables[key];
          codeText += key + ':' + variable.className + '\n';
        }

        $('#connection-list .container').children().each(function(index, element) {
          var $element = $(element);
          codeText += $element.text() + '\n';
        });

        if (codeText !== '') {
          var encodedCodeText = 'data:application/octet-stream,' + encodeURIComponent(codeText);
          var win = window.open(isIE ? 'about:blank' : encodedCodeText, '');
          if (win && win.document) {
            win.document.open();
            win.document.write('<pre>' + codeText + '</pre>');
            win.document.close();
          }
        }

        deferred.resolve();
        return deferred.promise();
      }
    }
  };

  function chainParse(line, types) {
    for (var i = 0, len = types.length; i < len; i += 1) {
      var type = types[i];
      var option = command[type].parse(line);
      if (option) {
        option.type = type;
        return option;
      }
    }
  }

  function startWithColon(s) {
    return s.charAt(0) === ':';
  }

  app.parseCommand = function(line) {
    if (typeof line === 'undefined' || line === null)
      return null;

    line = $.trim(line);

    var option = chainParse(line, ['empty', 'comment']) ||
                 (startWithColon(line) ?
                    chainParse(line, ['load', 'clear', 'save']) :
                    chainParse(line, ['update', 'declare', 'connect',
                                      'dispatch', 'disconnect', 'delete'])) ||
                 null;

    return option;
  };

  app.execCommand = function(line, variables) {
    var deferred = $.Deferred();
    var option = app.parseCommand(line);

    if (option === null) {
      deferred.reject();
      return deferred.promise();
    }

    var execFuncion = command[option.type].exec;
    if (typeof execFuncion === 'function') {
      execFuncion(option, variables)
        .done(deferred.resolve)
        .fail(deferred.reject);
    }

    return deferred.promise();
  };

  $(window).bind('message', function(e) {
    var messageData = JSON.parse(e.originalEvent.data);
    var variable = app.variables[messageData.id];
    if (!variable)
      return;
    var messageFunc = variable['on' + messageData.type];
    if (typeof messageFunc === 'function')
      messageFunc.call(variable, messageData);
  });

  // for declare
  function createModuleElement(variableName, className, src) {
    var $module = $($('#module-template').html());
    $module.children('.header').children('.variable-name').text(variableName);
    $module.children('.header').children('.class-name').text(className);
    $module.find('.component').attr('src', src);
    return $module;
  }
  function createModule(variableName, className) {
    var src = 'coco_modules/' + className.replace(/\./g, '/') + '.html';
    var url = src + '?' + (new Date().getTime()) + '#' + variableName;
    var $el = createModuleElement(variableName, className, url);
    var variable = {
      name: variableName,
      className: className,
      src: src,
      $el: $el,
      loaded: false,
      onload: onLoadVariable,
      onprop: onPropVariable,
      onevent: onEventVariable
    };
    return variable;
  }
  function onLoadVariable(messageData) {
    var data = messageData.data;
    this.loaded = true;
    this.data = data;
    var $el = this.$el;
    $el.children('.loading').hide();
    $el.find('.component').height(data.componentHeight);
    if (data.componentHeight === '0px') {
      $el.find('.component').hide();
      $el.css('border-bottom', '0');
    }
    this.cel = circuit.create(createCircuitElement(this.variables, this.name, data));
  }
  function createCircuitElement(variables, variableName, data) {
    var base = {prop: {}, event: {}};

    var prop = data.prop || {};
    for (var key in prop) {
      base.prop[key] = {};
      if ('in' in prop[key]) {
        base.prop[key]['in'] = (function(variableName, key) {
          return function() {
            var value = Array.prototype.slice.call(arguments);
            variables[variableName].data.prop[key].data = value;
            var data = {type: 'prop', target: key, data: value};
            variables[variableName].$el.find('.component').get(0)
              .contentWindow.postMessage(JSON.stringify(data), '*');
          };
        }(variableName, key));
      }
      if ('out' in prop[key]) {
        base.prop[key]['out'] = (function(variableName, key) {
          return function(value) {
            return variables[variableName].data.prop[key].data;
          };
        }(variableName, key));
      }
    }

    var event = data.event || {};
    for (var key in event) {
      base.event[key] = {};
      if ('in' in event[key]) {
        base.event[key]['in'] = (function(variableName, key) {
          return function() {
            var data = {type: 'event', target: key, isConnected: true};
            variables[variableName].$el.find('.component').get(0)
              .contentWindow.postMessage(JSON.stringify(data), '*');
          };
        }(variableName, key));
      }
      if ('out' in event[key])
        base.event[key]['out'] = circuit.noop;
    }

    return base;
  }
  function onPropVariable(messageData) {
    this.data.prop[messageData.target].data = messageData.data;
    this.cel.updateProperty(messageData.target);
  }
  function onEventVariable(messageData) {
    this.cel.dispatchEvent(messageData.target);
  }
  function activateModule(variableName, variable) {
    var deferred = $.Deferred();
    var $el = variable.$el;
    $el.find('.component').load(function() {
      setTimeout(function() {
        if (variable.loaded) {
          deferred.resolve();
        } else {
          var $el = variable.$el;
          $el.remove();
          delete variable.variables[variableName];
          deferred.reject();
        }
      }, (isIE ? 1000 / 60 : 0));
    });

    $('#module-list .container').append($el);
    return deferred.promise();
  }

  // for connect
  function createConnectionText(type, source, target) {
    var arrow = (type === 'prop') ? ' => ' : ' -> ';
    return source.name + '.' + source.target + arrow +
           target.name + '.' + target.target;
  }

  function createConnectionElement(type, source, target) {
    var $connection = $($('#connection-template').html());
    $connection.text(createConnectionText(type, source, target));
    return $connection;
  }

  app.execCommand(':load init.coco', app.variables);

  // input
  var $input = $('#header input');
  var keyDownInputListener = (function() {
    var inputHistories = [];
    var currentIndex = 0;
    return function(event) {
      switch (event.which) {
        case 13:
          event.preventDefault();
          $input.prop('disabled', true);
          var command = event.target.value;
          app.execCommand(event.target.value, app.variables)
              .done(function() {
                inputHistories.push(command);
                currentIndex = inputHistories.length;
                $input.val('');
              })
              .always(function() {
                $input.prop('disabled', false);
                $input.blur();
                setTimeout(function() {
                  $input.focus();
                }, 0);
              });
          break;
        case 38:
          event.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          $input.val(inputHistories[currentIndex] || inputHistories[0]);
          break;
        case 40:
          event.preventDefault();
          currentIndex = Math.min(currentIndex + 1, inputHistories.length);
          $input.val(inputHistories[currentIndex] || '');
          break;
        default:
          break;
      }
    };
  }());
  $input.bind('keydown', keyDownInputListener);
  setTimeout(function() {
    $input.val('');
    $input.focus();
  }, 0);

}(jQuery));