var assert = require('assert');
var command = require('../js/models/command.js');

describe('command', function() {
  describe('#expandAbbreviation', function() {
    [
      ['x:Module', ':new x Module'],
      ['x :Module', ':new x Module'],
      ['x: Module', ':new x Module'],
      ['x : Module', ':new x Module'],

      ['x.member0 >> y.member1', ':bind x.member0 y.member1'],
      ['x.member0>>y.member1', ':bind x.member0 y.member1'],
      ['x.member0 >>y.member1', ':bind x.member0 y.member1'],
      ['x.member0>> y.member1', ':bind x.member0 y.member1'],

      ['x.member0 <<', ':send x.member0'],
      ['x.member0<<', ':send x.member0'],
      ['x.member0 << data_text', ':send x.member0 data_text'],
      ['x.member0<<data_text', ':send x.member0 data_text'],
      ['x.member0 <<data_text', ':send x.member0 data_text'],
      ['x.member0<< data_text', ':send x.member0 data_text'],
      ['x.member0 << "data_text"', ':send x.member0 "data_text"'],

      [':noop', ':noop'],
      [':new x Module', ':new x Module'],
      [':bind x.member0 y.member1', ':bind x.member0 y.member1'],
      [':unbind x.member0 y.member1', ':unbind x.member0 y.member1'],
      [':send x.member0', ':send x.member0'],
      [':send x.member0 data_text', ':send x.member0 data_text'],
      [':delete x', ':delete x'],
      [':reset', ':reset'],
      [':load', ':load'],
      [':load /path/to/script', ':load /path/to/script'],
      [':save', ':save'],
      [':save /path/to/script', ':save /path/to/script']
    ].forEach(function(p) {
      it('"' + p[0] + '"', function() {
        assert.equal(command.expandAbbreviation(p[0]), p[1]);
      });
    });
  });

  describe('#parseStatement', function() {
    [
      [':noop',
        { name: 'noop' }],

      [':new x Module',
        { name: 'new', variableName: 'x', moduleName: 'Module' }],

      [':new  x \t Module',
        { name: 'new', variableName: 'x', moduleName: 'Module' }],

      [':New x Module',
        { name: 'new', variableName: 'x', moduleName: 'Module' }],

      [':NEW x Module',
        { name: 'new', variableName: 'x', moduleName: 'Module' }],

      [':bind x.member0 y.member1',
        { name: 'bind',
          sourceVariableName: 'x', sourceMemberName: 'member0',
          targetVariableName: 'y', targetMemberName: 'member1' }],

      [':unbind x.member0 y.member1',
        { name: 'unbind',
          sourceVariableName: 'x', sourceMemberName: 'member0',
          targetVariableName: 'y', targetMemberName: 'member1' }],

      [':send x.member0',
        { name: 'send',
          variableName: 'x', memberName: 'member0', dataText: '' }],

      [':send x.member0 data_text',
        { name: 'send',
          variableName: 'x', memberName: 'member0', dataText: 'data_text' }],

      [':send x.member0 \'data text\'',
        { name: 'send',
          variableName: 'x', memberName: 'member0', dataText: 'data text' }],

      [':send x.member0 "data text"',
        { name: 'send',
          variableName: 'x', memberName: 'member0', dataText: 'data text' }],

      [':send x.member0 "data_text"',
        { name: 'send',
          variableName: 'x', memberName: 'member0', dataText: 'data_text' }],

      [':send x.member0 \\"data_text"',
        { name: 'send',
          variableName: 'x', memberName: 'member0', dataText: '"data_text"' }],

      [':send x.member0 "data_text\'',
        { name: 'send',
          variableName: 'x', memberName: 'member0', dataText: '"data_text\'' }],

      [':delete x',
        { name: 'delete', variableName: 'x' }],

      [':reset',
        { name: 'reset' }],

      [':load',
        { name: 'load', filePath: '' }],

      [':load /path/to/script',
        { name: 'load', filePath: '/path/to/script' }],

      [':save',
        { name: 'save', filePath: '' }],

      [':save /path/to/script',
        { name: 'save', filePath: '/path/to/script' }]
    ].forEach(function(p) {
      it('"' + p[0] + '"', function() {
        assert.deepEqual(command.parseStatement(p[0]), p[1]);
      });
    });
  });

  describe('#parseStatement (empty)', function() {
    [
      '',
      ' ',
      ' \t '
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.equal(command.parseStatement(p).name, 'noop');
      });
    });
  });

  describe('#parseStatement (comment)', function() {
    [
      '#',
      '# comment',
      ' # comment '
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.equal(command.parseStatement(p).name, 'noop');
      });
    });
  });

  describe('#parseStatement (error)', function() {
    [
      ':',
      ':_command',
      'command',
      ':new',
      ':new x',
      ':new x y z',
      ':new x.y z',
      ':new x y.z',
      ':new _x y',
      ':new x _y',
      ':bind',
      ':bind x.member0',
      ':bind x.member0 y.member1 z.member2',
      ':bind x y',
      ':bind x.member0 y',
      ':bind x.member0 y.member1.member2',
      ':unbind',
      ':unbind x.member0',
      ':unbind x.member0 y.member1 z.member2',
      ':unbind x y',
      ':unbind x.member0 y',
      ':unbind x.member0 y.member1.member2',
      ':send',
      ':send x',
      ':send x.member0.member1',
      ':send x.member0 data text',
      ':send x.member0 \\"data text\\"',
      ':delete',
      ':delete x y',
      ':delete _x',
      ':delete x.y',
      ':reset x',
      ':load x y',
      ':save x y'
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.throws(function() {
          command.parseStatement(p);
        }, SyntaxError);
      });
    });
  });
});