var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var install = require('gulp-install');
var rename = require('gulp-rename');
var zip = require('gulp-zip');
var AWS = require('aws-sdk');
var fs = require('fs');
var runSequence = require('run-sequence');
var request = require('request-promise');
var dotenv = require('dotenv');
var fs = require('fs');
var argv = require('yargs').argv;

dotenv.load();

gulp.task('clean', function(callback) {
  return del('dist',
    del('dist.zip', callback)
  );
});

gulp.task('js', function() {
  return gulp.src(['apps/plex/*', '!apps/plex/node_modules'])
    .pipe(gulp.dest('dist/'));
});

gulp.task('npm', function() {
  return gulp.src('dist/package.json')
    .pipe(install({production: true}));
});

gulp.task('env', function() {
  return gulp.src('plex.env.production')
    .pipe(rename('.env'))
    .pipe(gulp.dest('dist'));
});

gulp.task('zip', function() {
  return gulp.src(['dist/**/*', '!dist/package.json', 'dist/.*'])
    .pipe(zip('dist.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('upload', function(done) {
  // TODO: get all this from config file or something
  AWS.config.region = 'us-east-1';
  var lambda = new AWS.Lambda();
  var functionName = 'homerTest';

  // Check if function exists:
  lambda.getFunction({FunctionName: functionName}, function(err, data) {
    if (err) {
      var warning;
      if (err.statusCode === 404) {
        warning = 'Unable to find lambda function ' + functionName + '. ';
        warning += 'Verify the lambda function name and AWS region are correct.';
        gutil.log(warning);
      } else {
        warning = 'AWS API request failed. ';
        warning += 'Check your AWS credentials and permissions.';
        gutil.log(warning);
      }
    }

    var params = {
      FunctionName: functionName
    };

    fs.readFile('dist.zip', function(err, data) {
      params['ZipFile'] = data;
      lambda.updateFunctionCode(params, function(err, data) {
        if (err) {
          var warning = 'Package upload failed. ';
          warning += 'Check your iam:PassRole permissions.';
          gutil.log(warning);
        } else {
          done();
        }
      });
    });
  });
});

gulp.task('fetchDictionaries', function(callback) {
  request(process.env.HOMER_ADDRESS + '/api/plex/dictionary').then(function(response) {
    fs.writeFileSync('apps/plex/dictionary.json', response);
    callback();
  }).catch(function(error) {
    console.error(error);
    callback();
  });
});

gulp.task('deploy', function(callback) {
  var tasks = ['clean'];

  if (argv.dictionaries) tasks.push('fetchDictionaries');

  tasks = tasks.concat([
    'js',
    ['npm', 'env'],
    'zip',
    'upload',
    callback
  ]);

  runSequence.apply(null, tasks);// );
});
