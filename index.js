'use strict';
var M = require('@mfjs/core'), Rx = require('rx');

module.exports = function(opts) {
  function ObservableWrap(inner) {
    this.inner = inner;
  }
  var Observable = Rx.Observable, defs = {};
  if (opts == null)
    opts = {};
  if (opts.control == null)
    opts.control = "token";
  if (opts.wrap === true)
    opts.wrap = ObservableWrap;
  Observable = Rx.Observable;
  function coerce(v) {
    if (Observable.isObservable(v))
      return v;
    if (Rx.helpers.isPromise(v))
      return Observable.fromPromise(v);
    return Observable["return"](v);
  }
  defs.pure = Observable["return"];
  defs.coerce = coerce;
  defs.apply = function(e, f) {
    //TODO: eta
    return coerce(e).map(function(v) {
      return f(v);
    });
  };
  defs.arr = Observable.combineLatest;
  defs.empty = Observable.empty;
  defs.alt = Observable.merge;
  defs.bind =  opts.latest
    ? function(v, f) {
      return v.flatMapLatest(function(v) {
        return f(v);
      });
    }
    : function(v, f) {
      return v.flatMap(function(v) {
        return f(v);
      });
    };
  if (opts.exceptions) {
    defs.raise = Observable["throw"];
    defs.handle = function(a, f) {
      return a["catch"](function(v) {
        return f(v);
      });
    };
    defs["finally"] = function(a, f) {
      return a["finally"](function(v) {
        return f(v);
      });
    };
  }
  defs = M.defaults(defs,opts)
  if (!opts.wrap) {
    M.completePrototype(defs,Observable.prototype);
  }
  return defs;
};
