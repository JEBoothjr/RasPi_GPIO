var express = require('express'),
    app = express(),
    GPIO = require('./RasPi_GPIO');

var pin7 = new GPIO(7, function(err) {
    if (err) {
        console.log(err);
    }
});
var pin8 = new GPIO(8, function(err) {
    if (err) {
        console.log(err);
    }
});

app.put('/api/gpio/:pin_num/:pin_value', function(req, res) {
    var pin_num = parseInt(req.params.pin_num),
        pin_value = req.params.pin_value.toLowerCase(),
        io;

    if (pin_num === 8) {
        io = pin8;
    } else if (pin_num === 7) {
        io = pin7;
    } else {
        return res.status(404).send('Unsupported GPIO Pin: ' + pin_num);
    }

    io.write(pin_value, function(err, result) {
        if (err) {
            res.status(500).send(err.type + " : " + err.data);
        } else {
            res.status(200).end();
        }
    });
});

var server = app.listen(3000, function() {
    var port = server.address().port;

    console.log('RasPi app listening on port %s', port)
});

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
    pin7.unexport();
    pin8.unexport();

    if (options.cleanup) {
        //console.log('clean');
    }
    if (err) {
        console.error(err.stack);
    }
    if (options.exit) {
        process.exit();
    }
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {
    cleanup: true
}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
    exit: true
}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
    exit: true
}));