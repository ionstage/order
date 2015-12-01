var assert = require('assert');
var command = require('../js/models/command.js');

describe('command', function() {
  it('#names', function() {
    assert.deepEqual(command.names(), [
      'noop',
      'declare',
      'bind',
      'unbind',
      'send'
    ]);
  });

  describe('#expandAbbreviation', function() {
    [
      ['x:Module', ':declare x Module'],
      ['x :Module', ':declare x Module'],
      ['x: Module', ':declare x Module'],
      ['x : Module', ':declare x Module'],

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
      [':declare x Module', ':declare x Module'],
      [':bind x.member0 y.member1', ':bind x.member0 y.member1'],
      [':unbind x.member0 y.member1', ':unbind x.member0 y.member1'],
      [':send x.member0 data_text', ':send x.member0 data_text']
    ].forEach(function(p) {
      it('"' + p[0] + '"', function() {
        assert.equal(command.expandAbbreviation(p[0]), p[1]);
      });
    });
  });

  describe('#parseStatement', function() {
    [
      [':noop', command.Noop, {}],

      [':declare x Module',
        command.Declare,
        { variableName: 'x', moduleName: 'Module'}],

      [':declare  x \t Module',
        command.Declare,
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
        { variableName: 'x', memberName: 'member0', dataText: '"data_text\'' }]
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
      ':declare x',
      ':declare x y z',
      ':declare x.y z',
      ':declare x y.z',
      ':declare _x y',
      ':declare x _y',
      ':bind x.member0',
      ':bind x.member0 y.member1 z.member2',
      ':bind x y',
      ':bind x.member0 y',
      ':bind x.member0 y.member1.member2',
      ':unbind x.member0',
      ':unbind x.member0 y.member1 z.member2',
      ':unbind x y',
      ':unbind x.member0 y',
      ':unbind x.member0 y.member1.member2',
      ':send x',
      ':send x.member0.member1',
      ':send x.member0 data text',
      ':send x.member0 \\"data text\\"'
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.throws(function() {
          command.parseStatement(p);
        }, SyntaxError);
      });
    });
  });
});