var express = require('express'),
    app = express(),
    GPIO = require('./RasPi_GPIO');

var gpio7 = new GPIO(7, function(err) {
    if (err) {
        console.log(err);
    }
});
// var gpio4 = new GPIO(4, function(err) {
//     if (err) {
//         console.log(err);
//     }
// });

app.put('/api/gpio/:channel_id/:channel_value', function(req, res) {
    var channel_id = parseInt(req.params.channel_id),
        channel_value = req.params.channel_value.toLowerCase(),
        io;

    if (channel_id === 4) {
        //io = gpio4;
        return res.status(404).send('Unknown GPIO: ' + channel_id);
    } else if (channel_id === 7) {
        io = gpio7;
    } else {
        return res.status(404).send('Unknown GPIO: ' + channel_id);
    }

    io.write(channel_value, function(err, result) {
        if (err) {
            res.status(500).send(err.type + " : " + err.data);
        } else {
            res.status(200).end();
        }
    });
});

var server = app.listen(3000, function() {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)

});