RasPi_GPIO
========

A node.js-based GPIO library for Raspberry Pi.

This was tested with Raspberry Pi Model B+, but should work with older versions as well.

When instantiating a GPIO, the library requires you to provide the physical pin number as the GPIO number will be coordinated internally.

An example app, 'app.js', is provided.

## Installation

Install node.js on the Raspberry Pi:

    sudo apt-get install nodejs npm

For root access to the pins, this library uses [gpio-admin](https://github.com/quick2wire/quick2wire-gpio-admin).

Here are the steps to install it, but for additional information, please visit that link.

    git clone git://github.com/quick2wire/quick2wire-gpio-admin.git
    cd quick2wire-gpio-admin
    make
    sudo make install
    sudo adduser $USER gpio (May not be needed if your using the 'pi' user as it's already a member of that group. Log out and log back in once added.)

## Usage

### GPIO(pinNumber, [options], [callback])

Exports the pin (associated GPIO) and optionally sets the ``direction`` and ``pull`` (enables the Pull Up and Pull Down Resistors). ``TODO : set the edge``

* ``pinNumber``: The pin number to export. 
* ``options``: (Optional) An object that supports ``direction`` ('in' or 'out') and ``pull`` ('up' or 'down'). Direction defaults to 'out' and 'pull' is not set by default.
* ``callback``: (Optional) Called when the pin is ready. Following standard node callback structure, the first argument is the error.

### .export([callback])

Exports the GPIO. This is done automatically during instantiation.

* ``callback``: (Optional) Called when the pin is exported. Following standard node callback structure, the first argument is the error.

### .unexport([callback])

Unexports the GPIO.

* ``callback``: (Optional) Called when the pin is unexported. Following standard node callback structure, the first argument is the error.

### .setDirection(direction, [callback])

Changes the direction to ``in`` or ``out``.

* ``direction``: ``in`` or ``out``.
* ``callback``: (Optional) Called when the pin direction is set. Following standard node callback structure, the first argument is the error.

### .getDirection([callback])

Gets the direction of the pin.

* ``callback``: (Optional) Called when the pin direction is read. Following standard node callback structure, the first argument is the error.

### .read([callback])

Reads the current value of the pin.

* ``callback``: (Optional) Called when the pin is read. Following standard node callback structure, the first argument is the error. The second argument, the value, will be the number ``0`` or ``1``.

Example:
```javascript
var GPIO = require('./RasPi_GPIO'),
    async = require('async'),
    pin7;

async.series({
    init: function(callback){
        pin7 = new GPIO(7, { direction:'in' }, function(err) {
            callback(err);
        });
    },
    read: function(callback){
        pin7.read(function(err, value) {
            callback(err, value);
        });
    }
}, function(err, result){
    console.log(result.read);
});
```

### .write(value, [callback])

Writes ``value`` to ``pinNumber``.

* ``value``: Supports most types of boolean values, for example, 0, 1, 'true', false.
* ``callback``: (Optional) Called when the pin value is written. Following standard node callback structure, the first argument is the error.

Example:
```javascript
var GPIO = require('./RasPi_GPIO'),
    async = require('async'),
    pin7;

async.series([
    function(callback){
        pin7 = new GPIO(7, function(err) {
            callback(err);
        });
    },
    function(callback){
        pin7.write(0, function(err) {
            callback(err);
        });
    }
], function(err){
    console.log(err);
});
```

## Tests

* The library is maintained using  gulp/mocha/instanbul for tests and coverage. To run tests and coverage, with gulp installed, run ``gulp``.

## TODO

* Edge support.
* Add synchronous reade/write calls.
* More testing.

## License

(The MIT License)

Copyright (c) 2014 James Booth <jeboothjr@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.