/*jslint node: true */
'use strict';

var request,
    fs = require('fs'),
    path = require('path'),
    proc = require("child_process"),
    async = require('async'),
    del = require('del'),
    mkdirp = require('mkdirp'),
    sinon = require('sinon'),
    should = require('should'),
    GPIO = require('../RasPi_GPIO'),
    SIM_ROOT = './test/simulation/sys',
    CPU_INFO_V1 = './test/simulation/proc/cpuinfo_v1',
    CPU_INFO_V2 = './test/simulation/proc/cpuinfo';

GPIO.GPIO_ROOT_PATH = SIM_ROOT + '/class/gpio';
GPIO.GPIO_CPU_INFO_FILE = CPU_INFO_V2;

describe("RasPi_GPIO", function() {

    describe("Initializing a GPIO", function() {

        beforeEach(function(done) {
            if (fs.existsSync(GPIO.GPIO_ROOT_PATH)) {
                del.sync(GPIO.GPIO_ROOT_PATH);
            }
            mkdirp.sync(GPIO.GPIO_ROOT_PATH);

            done();
        });

        afterEach(function(done) {
            if (fs.existsSync(SIM_ROOT)) {
                del.sync(SIM_ROOT);
            }

            done();
        });

        it("Should throw an error when instantiating a GPIO without a number", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                callback(null);
            });

            (function() {
                var gpio = new GPIO();
            }).should.throw("A valid pin number is require when instantiating a GPIO.");

            stub_write.restore();
            done();
        });

        it("Should throw an error when instantiating a GPIO without an invalid number", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                callback(null);
            });

            (function() {
                var gpio = new GPIO(4);
            }).should.throw("This pin number, 4, is not a valid pin.");

            stub_write.restore();
            done();
        });

        it("Should instantiate a GPIO without issue", function(done) {
            (function() {
                var gpio = new GPIO(7, {
                    export: false
                });
            }).should.not.throw();

            done();
        });

        it("Should create new instances", function(done) {
            var gpio1 = new GPIO(7, {
                    export: false,
                    direction: 'out'
                }),
                gpio2 = new GPIO(8, {
                    export: false,
                    direction: 'out'
                });

            (gpio1 === gpio2).should.equal(false);

            done();
        });

        it("Should initialize with v1 pins", function(done) {
            GPIO.initialized = false;
            GPIO.GPIO_CPU_INFO_FILE = CPU_INFO_V1;

            var gpio1 = new GPIO(3, {
                export: false,
                direction: 'out'
            });

            (gpio1.pin).should.equal(3);
            (gpio1.gpio).should.equal(0);

            GPIO.initialized = false;
            GPIO.GPIO_CPU_INFO_FILE = CPU_INFO_V2; //Reset it to V2 for further tests

            done();
        });
    });

    describe("Exporting a GPIO", function() {

        beforeEach(function(done) {
            if (fs.existsSync(GPIO.GPIO_ROOT_PATH)) {
                del.sync(GPIO.GPIO_ROOT_PATH);
            }
            mkdirp.sync(GPIO.GPIO_ROOT_PATH);

            done();
        });

        afterEach(function(done) {
            if (fs.existsSync(SIM_ROOT)) {
                del.sync(SIM_ROOT);
            }

            done();
        });

        it("Should export a GPIO using noop", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null);
                }),
                stub_exec = sinon.stub(proc, 'exec', function(command, callback) {
                    should.equal(command, 'gpio-admin export 4 ');
                    callback(null);
                }),
                gpio = new GPIO(7, {
                    direction: 'in'
                });

            stub_write.restore();
            stub_exec.restore();

            done();
        });

        it("Should export a GPIO manually", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null);
                }),
                stub_exec = sinon.stub(proc, 'exec', function(command, callback) {
                    should.equal(command, 'gpio-admin export 4 ');
                    callback(null);
                }),
                gpio = new GPIO(7, {
                    export: false
                });

            gpio.export({
                direction: 'out'
            });

            stub_write.restore();
            stub_exec.restore();

            done();
        });

        it("Should export a GPIO using callback", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null);
                }),
                stub_exec = sinon.stub(proc, 'exec', function(command, callback) {
                    should.equal(command, 'gpio-admin export 4 ');
                    callback(null);
                }),
                gpio = new GPIO(7, function(err, result) {
                    stub_write.restore();
                    stub_exec.restore();

                    should.equal(err, null);
                    should.exist(result);

                    done();
                });
        });

        it("Should export a GPIO with pull", function(done) {
            var stub_exec = sinon.stub(proc, 'exec', function(command, callback) {
                    stub_exec.restore();

                    should.equal(command, 'gpio-admin export 4 pullup');

                    callback(null);

                    done();
                }),
                gpio = new GPIO(7, {
                    pull: 'pullup'
                });
        });

        it("Should handle export error", function(done) {
            var stub_exec = sinon.stub(proc, 'exec', function(command, callback) {
                    callback(true);
                }),
                gpio = new GPIO(7).export(function(err, result) {
                    stub_exec.restore();

                    should.exist(err);
                    should.equal(err.type, 'export_error');
                    should.equal(err.data.pin, 7);
                    should.equal(err.data.gpio, 4);
                    should.exist(err.data.options);

                    done();
                });
        });
    });

    describe("Unexporting a GPIO", function() {

        beforeEach(function(done) {
            if (fs.existsSync(GPIO.GPIO_ROOT_PATH)) {
                del.sync(GPIO.GPIO_ROOT_PATH);
            }
            mkdirp.sync(GPIO.GPIO_ROOT_PATH);

            done();
        });

        afterEach(function(done) {
            if (fs.existsSync(SIM_ROOT)) {
                del.sync(SIM_ROOT);
            }

            done();
        });

        it("Should unexport a GPIO using noop", function(done) {
            var stub_exec = sinon.stub(proc, 'exec', function(command, callback) {
                    stub_exec.restore();

                    should.equal(command, 'gpio-admin unexport 4');
                    callback(null);

                    done();
                }),
                gpio = new GPIO(7, {
                    export: false
                }).unexport();



        });

        it("Should unexport a GPIO using callback", function(done) {
            var stub_exec = sinon.stub(proc, 'exec', function(command, callback) {
                    stub_exec.restore();
                    should.equal(command, 'gpio-admin unexport 4');
                    callback(null);
                }),
                gpio = new GPIO(7, {
                    export: false
                }).unexport(function(err, result) {
                    should.equal(err, null);
                    should.exist(result);

                    done();
                });
        });

        it("Should handle unexport error", function(done) {
            var stub_exec = sinon.stub(proc, 'exec', function(command, callback) {
                    callback(true);
                }),
                gpio = new GPIO(7, {
                    export: false
                }).unexport(function(err, result) {
                    should.exist(err);
                    should.equal(err.type, 'unexport_error');
                    should.equal(err.data.pin, 7);
                    should.equal(err.data.gpio, 4);

                    stub_exec.restore();

                    done();
                });


        });
    });

    describe("Reading a GPIO", function() {

        beforeEach(function(done) {
            if (fs.existsSync(GPIO.GPIO_ROOT_PATH)) {
                del.sync(GPIO.GPIO_ROOT_PATH);
            }
            mkdirp.sync(GPIO.GPIO_ROOT_PATH);

            done();
        });

        afterEach(function(done) {
            if (fs.existsSync(SIM_ROOT)) {
                del.sync(SIM_ROOT);
            }

            done();
        });

        it("Should read a GPIO using callback", function(done) {
            var stub_read = sinon.stub(fs, 'readFile', function(path, callback) {
                    callback(null, '0');
                }),
                gpio = new GPIO(7);

            gpio.read(function(err, result) {
                stub_read.restore();

                should.equal(err, null);
                should.exist(result);
                should.equal(result, 0);

                done();
            });
        });

        it("Should read a GPIO using noop", function(done) {
            var stub_read = sinon.stub(fs, 'readFile', function(path, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            (function() {
                gpio.read();
            }).should.not.throw();

            stub_read.restore();

            done();
        });

        it("Should handle read error", function(done) {
            var stub_read = sinon.stub(fs, 'readFile', function(path, callback) {
                    callback(true);
                }),
                gpio = new GPIO(7);

            gpio.export();

            gpio.read(function(err, result) {
                stub_read.restore();

                should.exist(err);
                should.equal(err.type, 'read_error');
                should.equal(err.data.pin, 7);
                should.equal(err.data.gpio, 4);

                done();
            });
        });
    });

    describe("Writing a GPIO", function() {

        beforeEach(function(done) {
            if (fs.existsSync(GPIO.GPIO_ROOT_PATH)) {
                del.sync(GPIO.GPIO_ROOT_PATH);
            }
            mkdirp.sync(GPIO.GPIO_ROOT_PATH);

            done();
        });

        afterEach(function(done) {
            if (fs.existsSync(SIM_ROOT)) {
                del.sync(SIM_ROOT);
            }

            done();
        });

        it("Should write a GPIO using callback", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            gpio.write(1, function(err, result) {
                stub_write.restore();

                should.equal(err, null);
                should.exist(result);
                should.equal(result, 1);

                done();
            });
        });

        it("Should write a GPIO using callback using non-integer true", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            gpio.write(true, function(err, result) {
                stub_write.restore();

                should.equal(err, null);
                should.exist(result);
                should.equal(result, 1);

                done();
            });
        });

        it("Should write a GPIO using callback using non-integer 'TRUE'", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            gpio.write('TRUE', function(err, result) {
                stub_write.restore();

                should.equal(err, null);
                should.exist(result);
                should.equal(result, 1);

                done();
            });
        });

        it("Should write a GPIO using callback using non-integer '0'", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            gpio.write('0', function(err, result) {
                stub_write.restore();

                should.equal(err, null);
                should.exist(result);
                should.equal(result, 0);

                done();
            });
        });

        it("Should write a GPIO using callback using non-integer 'false'", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            gpio.write('false', function(err, result) {
                stub_write.restore();

                should.equal(err, null);
                should.exist(result);
                should.equal(result, 0);

                done();
            });
        });

        it("Should write a GPIO using noop", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            (function() {
                gpio.write(1);
            }).should.not.throw();

            stub_write.restore();

            done();
        });

        it("Should write a GPIO using a non boolean value", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            (function() {
                gpio.write('x');
            }).should.not.throw();

            stub_write.restore();

            done();
        });

        it("Should handle write error", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(true);
                }),
                gpio = new GPIO(7);

            gpio.write(1, function(err, result) {
                stub_write.restore();

                should.exist(err);
                should.equal(err.type, 'write_error');
                should.equal(err.data.pin, 7);
                should.equal(err.data.gpio, 4);

                done();
            });
        });
    });

    describe("Setting direction on a GPIO", function() {

        beforeEach(function(done) {
            if (fs.existsSync(GPIO.GPIO_ROOT_PATH)) {
                del.sync(GPIO.GPIO_ROOT_PATH);
            }
            mkdirp.sync(GPIO.GPIO_ROOT_PATH);

            done();
        });

        afterEach(function(done) {
            if (fs.existsSync(SIM_ROOT)) {
                del.sync(SIM_ROOT);
            }

            done();
        });

        it("Should set direction on a GPIO using callback", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 0);
                }),
                gpio = new GPIO(7);

            gpio.setDirection('out', function(err, result) {
                stub_write.restore();

                should.equal(err, null);
                should.exist(result);
                should.equal(result, 'out');

                done();
            });
        });

        it("Should set direction on a GPIO using noop", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(null, 'out');
                }),
                gpio = new GPIO(7);

            (function() {
                gpio.setDirection('out');
            }).should.not.throw();

            stub_write.restore();

            done();
        });

        it("Should handle setDirection error", function(done) {
            var stub_write = sinon.stub(fs, 'writeFile', function(path, data, encoding, callback) {
                    callback(true);
                }),
                gpio = new GPIO(7);

            gpio.setDirection(function(err, result) {
                stub_write.restore();

                should.exist(err);
                should.equal(err.type, 'setDirection_error');
                should.equal(err.data.pin, 7);
                should.equal(err.data.gpio, 4);

                done();
            });
        });
    });

    describe("Getting direction on a GPIO", function() {

        beforeEach(function(done) {
            if (fs.existsSync(GPIO.GPIO_ROOT_PATH)) {
                del.sync(GPIO.GPIO_ROOT_PATH);
            }
            mkdirp.sync(GPIO.GPIO_ROOT_PATH);

            done();
        });

        afterEach(function(done) {
            if (fs.existsSync(SIM_ROOT)) {
                del.sync(SIM_ROOT);
            }

            done();
        });

        it("Should get direction on a GPIO using callback", function(done) {
            var stub_read = sinon.stub(fs, 'readFile', function(path, callback) {
                    callback(null, 'out');
                }),
                gpio = new GPIO(7);

            gpio.getDirection(function(err, result) {
                stub_read.restore();

                should.equal(err, null);
                should.exist(result);
                should.equal(result, 'out');

                done();
            });
        });

        it("Should set direction on a GPIO using noop", function(done) {
            var stub_read = sinon.stub(fs, 'readFile', function(path, callback) {
                    callback(null, 'out');
                }),
                gpio = new GPIO(7);

            (function() {
                gpio.getDirection();
            }).should.not.throw();

            stub_read.restore();

            done();
        });

        it("Should handle setDirection error", function(done) {
            var stub_read = sinon.stub(fs, 'readFile', function(path, callback) {
                    callback(true);
                }),
                gpio = new GPIO(7);

            gpio.getDirection(function(err, result) {
                stub_read.restore();

                should.exist(err);
                should.equal(err.type, 'getDirection_error');
                should.equal(err.data.pin, 7);
                should.equal(err.data.gpio, 4);

                done();
            });
        });
    });
});