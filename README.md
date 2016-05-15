# @mfjs/rx

The library is intended to be used with
[@mfjs/compiler](https://github.com/awto/mfjs-compiler)
to turn JavaScript into reactive programming language.

## Usage

    $ npm install --save-dev @mfjs/compiler
    $ npm install --save @mfjs/core rx @mfjs/rx
    $ mfjsc input-file.js -o dist

    # or for browser
    $ npm install --save-dev browserify @mfjs/compiler
    $ npm install --save @mfjs/core rx @mfjs/rx
    $ browserify -t @mfjs/compiler/monadify input.js -o index.js

Since Observable monad is quite heavy it is better to use the library
with minimal profile where only values wrapped with M are bound.

```javascript
const M = require('@mfjs/core')
const RxM = require('@mfjs/rx')()

RxM.run(function() {
  for (let i = 1; i < 4; ++i)
    M.yield(i)
  M.empty();
})

```

Will return observable signaling 1,2,3.

## Configuration

The call to `require('@mfjs\rx')` returns function for constructing 
monad definition object. There are a few options:

 * `latest` - by default monad will use flatMap as in original RX .NET LINQ 
              mapping, but if this field is true it will instead use flatMapLatest
 * `exception` - the resulting monad will use `Observable::catch` and 
                 `Observable::handle` functions for encoding try-catch statement. 
                 Or otherwise by default it will use default token based control signaling.
 * `wrap` - this option doesn’t change semantics but it wraps Observable into a wrapper 
            so original Observable prototype isn’t changed.

## License

Copyright © 2016 Vitaliy Akimov

Distributed under the terms of the [The MIT License (MIT)](LICENSE). 


