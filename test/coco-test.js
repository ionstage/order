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
          targetVariableName: 'y', targetMemberName: 'member1' }]

    ].forEach(function(p) {
      it('"' + p[0] + '"', function() {
        var cmd = command.parseStatement(p[0]);
        assert(cmd instanceof p[1]);
        assert.deepEqual(cmd, p[2]);
      });
    });
  });

  describe('#parseStatement (error)', function() {
    [
      '',
      ':',
      ':_command',
      'command'
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.throws(function() {
          command.parseStatement(p);
        }, SyntaxError);
      });
    });
  });

  describe('#parseLine', function() {
    it('declare', function() {
      var cmd = command.parseLine('x:Module')[0];
      assert(cmd instanceof command.Declare);
      assert.equal(cmd.variableName, 'x');
      assert.equal(cmd.moduleName, 'Module');

      // with whitespace
      assert.deepEqual(command.parseLine('x :Module')[0], cmd);
      assert.deepEqual(command.parseLine('x: Module')[0], cmd);
      assert.deepEqual(command.parseLine('x : Module')[0], cmd);
    });

    it('bind', function() {
      var cmd = command.parseLine('x.member0 >> y.member1')[0];
      assert(cmd instanceof command.Bind);
      assert.equal(cmd.sourceVariableName, 'x');
      assert.equal(cmd.sourceMemberName, 'member0');
      assert.equal(cmd.targetVariableName, 'y');
      assert.equal(cmd.targetMemberName, 'member1');

      // without whitespace
      assert.deepEqual(command.parseLine('x.member0>>y.member1')[0], cmd);
      assert.deepEqual(command.parseLine('x.member0 >>y.member1')[0], cmd);
      assert.deepEqual(command.parseLine('x.member0>> y.member1')[0], cmd);
    });
  });

  describe('#parseLine (empty)', function() {
    [
      '',
      ' ',
      ' \t '
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.equal(command.parseLine(p).length, 0);
      });
    });
  });

  describe('#parseLine (comment)', function() {
    [
      '#',
      '# comment',
      ' # comment '
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.equal(command.parseLine(p).length, 0);
      });
    });
  });

  describe('#parseLine (error)', function() {
    [
      'x >> y',
      'x.member0 >> y',
      'x.member0 >> y.member1.member2'
    ].forEach(function(p) {
      it('"' + p + '"', function() {
        assert.throws(function() {
          command.parseLine(p);
        }, SyntaxError);
      });
    });
  });
});