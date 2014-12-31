var path = require('path'),
    fs = require('fs'),
    gulp = require('gulp'),
    istanbul = require('gulp-istanbul'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    runSequence = require('run-sequence'),
    coverageEnforcer = require('gulp-istanbul-enforcer'),
    spawn = require('child_process').spawn,
    del = require('del'),
    SOURCES = [
        './RasPi_GPIO.js'
    ],
    isWatching = false; //If we are watching, set this to true in the watch method

/**
 * Creates git hooks to run jshint on commits and test coverage on push
 */
gulp.task('updateGitHooks', function(cb) {
    var hookFiles = ['./scripts/git/hooks/pre-push.js', './scripts/git/hooks/pre-commit.js'],
        i,
        file,
        hookFile,
        hookName,
        hookPath,
        re = /[^/]+.js/i;

    for (i = 0; i < hookFiles.length; i++) {
        hookFile = re.exec(hookFiles[i])[0];
        hookName = hookFile.split('.')[0];
        hookPath = path.resolve('.git/hooks/' + hookName);
        file = fs.readFileSync(hookFiles[i]);
        fs.writeFileSync(hookPath, file);
        fs.chmodSync(hookPath, '755');

        console.log("Created " + hookName + " hook.");
    }

    cb();
});

//Set the environment variable to test for the gulp process ONLY
gulp.task('env:test', function(cb) {
    process.env.NODE_ENV = "test";
    cb();
});

//Set the environment variable to development for the gulp process ONLY
gulp.task('env:dev', function(cb) {
    process.env.NODE_ENV = "development";
    cb();
});

//Set the environment variable to staging for the gulp process ONLY
gulp.task('env:stg', function(cb) {
    process.env.NODE_ENV = "staging";
    cb();
});

//Set the environment variable to production for the gulp process ONLY
gulp.task('env:prod', function(cb) {
    process.env.NODE_ENV = "production";
    cb();
});

/**
 * Clean up files as needed
 */
//Remove previous code coverage files
gulp.task('clean:coverage', function(cb) {
    del(['./coverage'], cb);
});

/**
 * Runs jshint on the source and client files
 */
//Run jshint on the server code
gulp.task('jshint', function(cb) {
    return gulp.src(SOURCES)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

/*
 * The process gets stuck. This quits it.
 */
gulp.on('stop', function() {
    if (!isWatching) {
        process.nextTick(function() {
            process.exit(0);
        });
    }
});

gulp.task('enforce-coverage', function(cb) {
    var options = {
        thresholds: {
            statements: 60,
            branches: 60,
            lines: 60,
            functions: 60
        },
        coverageDirectory: './coverage',
        rootDirectory: ''
    };
    gulp
        .src('.')
        .pipe(coverageEnforcer(options))
        .on('end', cb);
});

//Does a complete test cleanup, runs jshint on node.js code, runs tests and generates coverage reports.
gulp.task('run-coverage', function(cb) {
    gulp.src(SOURCES, {
            base: './server'
        })
        .pipe(istanbul())
        .pipe(gulp.dest('./coverage/src'))
        .on('end', function() {
            return gulp.src(['./test/**/*.js'])
                .pipe(mocha({
                    reporter: 'spec',
                    timeout: 30000
                }))
                .pipe(istanbul.writeReports('./coverage'))
                .on('end', cb);
        });
});

gulp.task('coverage', function(cb) {
    runSequence('env:test', 'clean:coverage', 'run-coverage', 'enforce-coverage', cb);
});

//Run the tests only.
gulp.task('test', function(cb) {
    runSequence('env:test', 'test_internal', cb);
});

//Not meant to be run by itself, but in 'test'. run-sequence doesn't like it if its in the callback as it hangs.
gulp.task('test_internal', function(cb) {
    return gulp.src(['./test/**/*.js'])
        .pipe(mocha({
            reporter: 'spec',
            timeout: 30000
        }));
});

function spawnProcess(cmd, args, callback) {
    var child = spawn(cmd, args, {
            cwd: process.cwd()
        }),
        stdout = '',
        stderr = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        stdout += data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        stderr += data;
    });
    child.on('close', function(code) {
        if (callback) {
            callback();
        }
    });
}

gulp.task('default', ['jshint', 'coverage']);
gulp.task('commit', ['jshint']);
gulp.task('setup', ['updateGitHooks']);