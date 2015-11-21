var assert = require('assert');
var command = require('../js/models/command.js');

describe('command', function() {
  describe('#parseStatement', function() {
    [
      ['', command.Noop, {}]
    ].forEach(function(p) {
      it('"' + p[0] + '"', function() {
        var cmd = command.parseStatement(p[0]);
        assert(cmd instanceof p[1]);
        assert.deepEqual(cmd, p[2]);
      });
    });
  });

  describe('#parseLine', function() {
    it('empty', function() {
      assert.equal(command.parseLine('').length, 0);
      assert.equal(command.parseLine(' ').length, 0);
      assert.equal(command.parseLine(' \t ').length, 0);
    });

    it('comment', function() {
      assert.equal(command.parseLine('#').length, 0);
      assert.equal(command.parseLine('# comment').length, 0);
      assert.equal(command.parseLine(' # comment ').length, 0);
    });

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
      assert.equal(cmd.source.variableName, 'x');
      assert.equal(cmd.source.memberName, 'member0');
      assert.equal(cmd.target.variableName, 'y');
      assert.equal(cmd.target.memberName, 'member1');

      // without whitespace
      assert.deepEqual(command.parseLine('x.member0>>y.member1')[0], cmd);
      assert.deepEqual(command.parseLine('x.member0 >>y.member1')[0], cmd);
      assert.deepEqual(command.parseLine('x.member0>> y.member1')[0], cmd);

      // invalid
      assert.equal(command.parseLine('x >> y').length, 0);
      assert.equal(command.parseLine('x.member0 >> y').length, 0);
      assert.equal(command.parseLine('x.member0 >> y.member1.member2').length, 0);
    });

    it('unbind', function() {
      var cmd = command.parseLine('x.member0 \\\\ y.member1')[0];
      assert(cmd instanceof command.Unbind);
      assert.equal(cmd.source.variableName, 'x');
      assert.equal(cmd.source.memberName, 'member0');
      assert.equal(cmd.target.variableName, 'y');
      assert.equal(cmd.target.memberName, 'member1');

      // without whitespace
      assert.deepEqual(command.parseLine('x.member0\\\\y.member1')[0], cmd);
      assert.deepEqual(command.parseLine('x.member0 \\\\y.member1')[0], cmd);
      assert.deepEqual(command.parseLine('x.member0\\\\ y.member1')[0], cmd);

      // invalid
      assert.equal(command.parseLine('x \\\\ y').length, 0);
      assert.equal(command.parseLine('x.member0 \\\\ y').length, 0);
      assert.equal(command.parseLine('x.member0 \\\\ y.member1.member2').length, 0);
    });
  });
});