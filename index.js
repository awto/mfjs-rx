'use strict';
var M = require('@mfjs/core'), Rx = require('rx');

module.exports = function(opts) {
  var Observable = Rx.Observable, defs, proto;
  if (opts == null)
    opts = {};
  Observable = Rx.Observable;
  function coerce(v) {
    if (Observable.isObservable(v))
      return v;
    if (Rx.helpers.isPromise(v))
      return Observable.fromPromise(v);
    return Observable["return"](v);
  }
  function ObservableM() {}
  ObservableM.prototype = new M.MonadDict();
  ObservableM.prototype.pure = Observable["return"];
  ObservableM.prototype.coerce = coerce;
  ObservableM.prototype.apply = function(e, f) {
    return coerce(e).map(function(v) {
      return f(v);
    });
  };
  ObservableM.prototype.arr = Observable.combineLatest;
  ObservableM.prototype.empty = Observable.empty;
  ObservableM.prototype.alt = Observable.merge;
  ObservableM.prototype.bind =  opts.latest
    ? function(v, f) {
      return coerce(v).flatMapLatest(function(v) {
        return coerce(f(v));
      });
    }
    : function(v, f) {
      return coerce(v).flatMap(function(v) {
        return coerce(f(v));
      });
    };
  if (opts.exceptions) {
    ObservableM.prototype.raise = Observable["throw"];
    ObservableM.prototype.handle = function(a, f) {
      return coerce(a)["catch"](function(v) {
        return coerce(f(v));
      });
    };
    ObservableM.prototype["finally"] = function(a, f) {
      return coerce(a)["finally"](function(v) {
        return coerce(f(v));
      });
    };
  }
  defs = M.withControlByToken(new ObservableM());
  proto = Observable.prototype;
  function ObservableWrap(inner) {
    this.inner = inner;
  }
  if (opts.wrap) {
    defs = M.wrap(defs, ObservableWrap);
    proto = ObservableWrap.prototype;
  }
  defs = M.addContext(defs);
  M.completePrototype(defs, proto, true);
  return defs;
};
