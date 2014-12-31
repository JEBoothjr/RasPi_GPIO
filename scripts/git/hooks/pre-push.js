#!/usr/bin/env node

var spawn = require('child_process').spawn,
   path = require("path"),
   proc;

var isWin = /^win/.test(process.platform),
        rCommand = isWin ? 'gulp.cmd' : 'gulp';
proc = spawn(rCommand, [], { cwd: path.resolve(__dirname + '/../../') });

proc.stdout.on('data', function (data) {
    if(data.toString().trim() != ''){
        console.log(data.toString().trim());
    }
});

proc.stderr.on('data', function (data) {
    if(data.toString().trim() != ''){
        console.log(data.toString().trim());
    }
});

proc.on('close', function (code) {
   process.exit(code);
});