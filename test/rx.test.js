'use strict';
var M = require('@mfjs/core'),
    RxManyM = require('../')(),
    RxLatestM = require('../')({latest:true,wrap:true}),
    KM = require('@mfjs/core/test/kit/dist/noeff');
 M.profile('defaultMinimal');

function noeff(impl) {
  KM(M,
     function (txt, f) {
       var args = KM.defaultItArgs();
       return it(txt, function(done) {
         if (done.async)
           done = done.async();
         args.done = done;
         // bigger counters has no sence in current settings
         // it will build a huge graph with onNext overflow
         args.maxCnt = 100;
         impl.run(function() {
           return impl.unpack(f(args)).subscribe();
         });
       });
     });
}

function check(node,v,done) {
  if (done.async)
    done = done.async()
  node.toArray().subscribe(
    function(x) { expect(x).to.eql(v) },
    function(e) { expect().fail(e) },
    done)
}

M.option({
  test: {
    CallExpression:{
      match:{
        name:{"run":true}
      },
      select:'matchCallName',
      cases:{true:{sub:'defaultFull'}}
    },
    full: {
      CallExpression:{
        match:{
          name:{expect:true,equal:true,fail:true,check:true}
        }
      }
    },
    compile:true
  }
})
M.profile('test')

function eff(v) {
  return v;
}

function run(Impl) {

  describe('running rx monad', function() {
    context('with no reactive effects', function() {
      it('should return single value', function(done) {
        var k = RxManyM.run(function() {
          eff(1)
          return eff(2)
        })
        check(k,[2],done)
      })
    })
    context('with yield', function() {
      it('should answer its argument', function(done) {
        var k = RxManyM.run(function() {
          M.yield(1)
          M.yield(2)
          M.yield(3)
          return 4
        })
        check(k,[1,2,3,4],done)
      })
      it('should revert local variables values on backtracking', function(done) {
        var k = RxManyM.run(function() {
          var i = 1
          M.yield(i)
          i++
          expect(i).to.equal(2)
          M.empty()
          expect().fail()
          M.yield(i)
          expect(i).to.equal(1)
          M.yield(i)
          i++
          M.yield(i)
          M.empty()
        })
        check(k,[1,1,2],done)
      })
      context('in loop body', function() {
        it('should return an answer for each iteration', function(done) {
          var k = RxManyM.run(function() {
            for (let i = 1; i <= 4; ++i)
              M.yield(i)
            M.empty();
          })
          check(k,[1,2,3,4],done)
        })
      })
    })
  })


  describe('empty', function() {
    it('should return no answers', function(done) {
      var k = RxManyM.run(function() {
        M.empty()
      })
      check(k, [], done);
    })
  })
  
  describe('yield', function() {
    it('should discharge empty', function(done) {
      var k = RxManyM.run(function() {
        M.empty()
        expect().fail()
        M.yield(1)
        return 2
      })
      check(k, [2], done);
    })
  })

  describe('control flow', function() {
    var state = [],
        rec = function(v) { state.push(v) },
        ch = function() { expect(state).to.eql(Array.from(arguments)) }
    context('with labeled break', function() {
      it('should respect js control flow', function(done) {
        var k = RxManyM.run(function() {
          for(var i = 0; i < 5; i++) {
            rec('i1:'+i)
            if (i === 3)
              break
            rec('i2:'+i)
            M.yield(i)
            rec('i3:'+i)
            M.yield('i:'+i)
            rec('i4:'+i)
          }
          rec('i5:'+i)
          if (i === 3)
            M.empty()
          rec('i6:' + i)
          ch('i1:0','i2:0','i3:0','i4:0','i1:1','i2:1','i3:1','i4:1',
             'i1:2','i2:2','i3:2','i4:2','i1:3','i5:3','i3:3','i4:3',
             'i1:4','i2:4','i3:4','i4:4','i5:5','i6:5')
          return 'fin'
        })
        check(k,[0,'i:0',1,'i:1',2,'i:2','i:3',4,'i:4','fin'],done)
      })
    })
  })
}

describe('flatMapLatest bind',function() {
  noeff(RxLatestM)
  run(RxLatestM)
});

describe('flatMap bind',function() {
  noeff(RxManyM)
  run(RxManyM)
})

