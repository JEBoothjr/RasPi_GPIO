/*jslint node: true */
"use strict";

var fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    async = require('async'),
    _ = require('lodash'),
    child_process = require("child_process"),
    gpio_admin_command = 'gpio-admin',
    noop = function() {},
    //ZERO = new Buffer('0'),
    //ONE = new Buffer('1'),
    //DIR_IN = 'in',
    DIR_OUT = 'out',
    //EDGE_NONE = 'none',
    //EDGE_RISING = 'rising',
    //EDGE_FALLING = 'falling',
    //EDGE_BOTH = 'both';

    PIN_MAP = {
        V1: {
            '3': 0,
            '5': 1,
            '7': 4,
            '8': 14,
            '10': 15,
            '11': 17,
            '12': 18,
            '13': 21,
            '15': 22,
            '16': 23,
            '18': 24,
            '19': 10,
            '21': 9,
            '22': 25,
            '23': 11,
            '24': 8,
            '26': 7
        },
        V2: {
            '3': 2,
            '5': 3,
            '7': 4,
            '8': 14,
            '10': 15,
            '11': 17,
            '12': 18,
            '13': 27,
            '15': 22,
            '16': 23,
            '18': 24,
            '19': 10,
            '21': 9,
            '22': 25,
            '23': 11,
            '24': 8,
            '26': 7,
            '29': 5,
            '31': 6,
            '32': 12,
            '33': 13,
            '35': 19,
            '36': 16,
            '37': 26,
            '38': 20,
            '40': 21
        }
    },
    pinMap;

function toBoolean(value) {
    if (_.isNumber(value) || _.isBoolean(value)) {
        return Boolean(value);
    }

    switch (value.toLowerCase()) {
        case "true":
        case "yes":
        case "1":
            return true;
        case "false":
        case "no":
        case "0":
        case null:
            return false;
        default:
            return Boolean(value);
    }
}

function GPIOError(type, data) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, GPIOError);

    this.type = type;

    this.data = data;
}

util.inherits(GPIOError, Error);
GPIOError.prototype.name = 'GPIOError';
exports.GPIOError = GPIOError;

function GPIO(gpio, options, callback) {
    var self = this;

    if (!gpio || isNaN(parseInt(gpio, 10))) {
        throw new Error("A valid GPIO number is require when instantiating a GPIO.");
    }

    /* istanbul ignore else */
    if (arguments.length < 3) {
        callback = _.isFunction(options) ? options : noop;
        options = !options || _.isFunction(options) ? {} : options;
    }

    GPIO.initialize();

    this.pin = pinMap[gpio];

    if (typeof this.pin === 'undefined') {
        throw new Error("This pin number, " + gpio + ", is not a valid pin.");
    }

    if (options.export !== false) {
        async.series([
            function(callback) {
                self.export(options, callback);
            },
            function(callback) {
                self.setDirection(options && options.direction || DIR_OUT, callback);
            },
            function(callback) {
                //self.setEdge(options.edge || EDGE_NONE, callback);
                callback();
            }
        ], function(err, result) {
            callback(err, result);
        });
    }
}

GPIO.GPIO_ROOT_PATH = '/sys/class/gpio'; //public for testing purposes
GPIO.GPIO_CPU_INFO_FILE = '/proc/cpuinfo'; //public for testing purposes
GPIO.initialized = false; //public for testing purposes

util.inherits(GPIO, EventEmitter);
GPIO.prototype.name = 'GPIO';

//This auto-inits, but allows overriding of paths for testing
GPIO.initialize = function() {
    var cpuInfo,
        revMatch;

    if (GPIO.initialized) {
        return;
    }

    cpuInfo = fs.readFileSync(GPIO.GPIO_CPU_INFO_FILE, 'utf8');
    revMatch = cpuInfo.match(/Revision\s*:\s*[0-9a-f]*([0-9a-f]{4})/);
    pinMap = (parseInt(revMatch[1], 16) < 4) ? PIN_MAP.V1 : PIN_MAP.V2;

    GPIO.initialized = true;
};

GPIO.prototype.read = function(callback) {
    var self = this;

    callback = callback || noop; //Why would we need this, really?

    fs.readFile(GPIO.GPIO_ROOT_PATH + "/gpio" + this.pin + "/value", function(err, val) {
        if (err) {
            err = new GPIOError('read_error', {
                pin: self.pin
            });
        }
        callback(err, val);
    });
};

// GPIO.prototype.readSync = function() {
//      var result;
//     try {
//         result = fs.readFileSync(GPIO.GPIO_ROOT_PATH + "/gpio" + this.pin + "/value");
//     } catch (e) {
//         this.emit('error', new GPIOError('read_sync_error', {
//             pin: this.pin
//         }));
//     };
//     return result;
// };

GPIO.prototype.write = function(value, callback) {
    var self = this;

    value = toBoolean(value); //We want it to be a numeric boolean
    callback = callback || noop;

    fs.writeFile(GPIO.GPIO_ROOT_PATH + "/gpio" + this.pin + "/value", value, "utf8", function(err) {
        if (err) {
            err = new GPIOError('write_error', {
                pin: self.pin
            });
        }
        callback(err, value);
    });
};

// GPIO.prototype.writeSync = function(value) {
//     try {
//         fs.writeFileSync(GPIO.GPIO_ROOT_PATH + "/gpio" + this.pin + "/value", value, "utf8");
//     } catch (e) {
//         this.emit('error', new GPIOError('write_sync_error', {
//             pin: pinNum,
//             value: value
//         }));
//     }
// };

GPIO.prototype.setDirection = function(dir, callback) {
    var self = this;

    /* istanbul ignore else */
    if (arguments.length < 2) {
        callback = _.isFunction(dir) ? dir : noop;
        dir = !dir || _.isFunction(dir) ? DIR_OUT : dir;
    }

    fs.writeFile(GPIO.GPIO_ROOT_PATH + "/gpio" + this.pin + "/direction", dir, "utf8", function(err) {
        if (err) {
            err = new GPIOError('setDirection_error', {
                pin: self.pin,
                direction: dir
            });
        }
        callback(err, dir);
    });
};

GPIO.prototype.getDirection = function(callback) {
    var self = this;

    callback = callback || noop;

    fs.readFile(GPIO.GPIO_ROOT_PATH + "/gpio" + this.pin + "/direction", function(err, dir) {
        if (err) {
            err = new GPIOError('getDirection_error', {
                pin: self.pin,
                direction: dir
            });
        }
        callback(err, dir);
    });
};

GPIO.prototype.export = function(options, callback) {
    var self = this,
        pull;

    /* istanbul ignore else */
    if (arguments.length < 2) {
        callback = _.isFunction(options) ? options : noop;
        options = !options || _.isFunction(options) ? {} : options;
    }

    pull = options.pull || '';

    child_process.exec(gpio_admin_command + ' export ' + this.pin + ' ' + pull, function(err) {
        if (err) {
            err = new GPIOError('export_error', {
                pin: self.pin,
                options: options
            });
        }
        callback(err, self);
    });
};

GPIO.prototype.unexport = function(callback) {
    var self = this;

    callback = callback || noop;

    child_process.exec(gpio_admin_command + " unexport " + this.pin, function(err) {
        if (err) {
            err = new GPIOError('unexport_error', {
                pin: self.pin
            });
        }
        callback(err, self);
    });
};

module.exports = exports = GPIO;