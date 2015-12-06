var assert = require('assert');
var command = require('../js/models/command.js');

describe('command', function() {
  it('#names', function() {
    assert.deepEqual(command.names(), [
      'noop',
      'new',
      'bind',
      'unbind',
      'send',
      'delete',
      'reset',
      'load'
    ]);
  });

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
      [':send x.member0 data_text', ':send x.member0 data_text'],
      [':delete x', ':delete x'],
      [':reset', ':reset'],
      [':load /path/to/script', ':load /path/to/script']
    ].forEach(function(p) {
      it('"' + p[0] + '"', function() {
        assert.equal(command.expandAbbreviation(p[0]), p[1]);
      });
    });
  });

  describe('#parseStatement', function() {
    [
      [':noop', command.Noop, {}],

      [':new x Module',
        command.New,
        { variableName: 'x', moduleName: 'Module'}],

      [':new  x \t Module',
        command.New,
        { variableName: 'x', moduleName: 'Module'}],

      [':bind x.member0 y.member1',
        command.Bind,
        { sourceVariableName: 'x', sourceMemberName: 'member0',
          targetVariableName: 'y', targetMemberName: 'member1' }],

      [':unbind x.member0 y.member1',
        command.Unbind,
        { sourceVariableName: 'x', sourceMemberName: 'member0',
          targetVariableName: 'y', targetMemberName: 'member1' }],

      [':send x.member0',
        command.Send,
        { variableName: 'x', memberName: 'member0', dataText: '' }],

      [':send x.member0 data_text',
        command.Send,
        { variableName: 'x', memberName: 'member0', dataText: 'data_text' }],

      [':send x.member0 \'data text\'',
        command.Send,
        { variableName: 'x', memberName: 'member0', dataText: 'data text' }],

      [':send x.member0 "data text"',
        command.Send,
        { variableName: 'x', memberName: 'member0', dataText: 'data text' }],

      [':send x.member0 "data_text"',
        command.Send,
        { variableName: 'x', memberName: 'member0', dataText: 'data_text' }],

      [':send x.member0 \\"data_text"',
        command.Send,
        { variableName: 'x', memberName: 'member0', dataText: '"data_text"' }],

      [':send x.member0 "data_text\'',
        command.Send,
        { variableName: 'x', memberName: 'member0', dataText: '"data_text\'' }],

      [':delete x',
        command.Delete,
        { variableName: 'x' }],

      [':reset', command.Reset, {}],

      [':load /path/to/script',
        command.Load,
        { filePath: '/path/to/script' }]
    ].forEach(function(p) {
      it('"' + p[0] + '"', function() {
        var cmd = command.parseStatement(p[0]);
        assert(cmd instanceof p[1]);
        assert.deepEqual(cmd, p[2]);
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
        assert(command.parseStatement(p) instanceof command.Noop);
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
        assert(command.parseStatement(p) instanceof command.Noop);
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
      ':New x Module',
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
      ':load',
      ':load x y'
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.throws(function() {
          command.parseStatement(p);
        }, SyntaxError);
      });
    });
  });
});