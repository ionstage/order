var assert = require('assert');
var command = require('../js/models/command.js');

describe('command', function() {
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

      ['x:Module',
        command.Declare,
        { variableName: 'x', moduleName: 'Module'}],

      ['x :Module',
        command.Declare,
        { variableName: 'x', moduleName: 'Module'}],

      ['x: Module',
        command.Declare,
        { variableName: 'x', moduleName: 'Module'}],

      ['x : Module',
        command.Declare,
        { variableName: 'x', moduleName: 'Module'}],

      ['x.member0 >> y.member1',
        command.Bind,
        { sourceVariableName: 'x', sourceMemberName: 'member0',
          targetVariableName: 'y', targetMemberName: 'member1' }],

      ['x.member0>>y.member1',
        command.Bind,
        { sourceVariableName: 'x', sourceMemberName: 'member0',
          targetVariableName: 'y', targetMemberName: 'member1' }],

      ['x.member0 >>y.member1',
        command.Bind,
        { sourceVariableName: 'x', sourceMemberName: 'member0',
          targetVariableName: 'y', targetMemberName: 'member1' }],

      ['x.member0>> y.member1',
        command.Bind,
        { sourceVariableName: 'x', sourceMemberName: 'member0',
          targetVariableName: 'y', targetMemberName: 'member1' }]

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
      ':bind x.member0',
      ':bind x.member0 y.member1 z.member2',
      ':bind x y',
      ':bind x.member0 y',
      ':bind x.member0 y.member1.member2',
      'x >> y',
      'x.member0 >> y',
      'x.member0 >> y.member1.member2'
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.throws(function() {
          command.parseStatement(p);
        }, SyntaxError);
      });
    });
  });
});