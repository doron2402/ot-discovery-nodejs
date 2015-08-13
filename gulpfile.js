/* jshint ignore:start */
'use strict';

//mocha required options*****************

require('should');
//***************************************

// Include gulp
var gulp = require('gulp');
require('gulp-grunt')(gulp);
var istanbul = require('gulp-istanbul');
// We'll use mocha here, but any test framework will work
var mocha = require('gulp-mocha');
var isparta = require('isparta');
var coverageEnforcer = require('gulp-istanbul-enforcer');
var gulpIgnore = require('gulp-ignore');
var minimist = require('minimist');
var _ = require('lodash');

var defaultPaths = {
  scripts: ['discovery.js'],
  tests: ['tests/**/*.js', 'tests/*.js'],
  noCoverageTests: [],
  coverage: 'coverage/',
  zipCoverage: 'coverage/*'
};

var defaultCoverageThresholds = {
  statements: 61,
  branches: 50,
  functions: 65,
  lines: 61
};

function hasCoffeeScriptInPaths(paths) {
  var pathArray;
  for (var key in paths) {
    pathArray = paths[key];
    if (Array.isArray(pathArray) === false) {
      if (pathArray.indexOf('.coffee') > -1) {
        return true;
      }
    }
    for (var i = 0; i < pathArray.length; i++) {
      if (pathArray[i].indexOf('.coffee') > -1) {
        return true;
      }
    };
  }
  return false;
}

function test(gulp, path, opts) {
  opts = opts || {};

  var mochaOpts = minimist(process.argv.slice(2), {
    default: _.merge({
      timeout: 7000
    }, opts)
  });

  return gulp.src(path, {
      read: false
    })
    .pipe(mocha(mochaOpts));
}

var coverageTest = function(cb, paths, mochaOpts) {
  if (hasCoffeeScriptInPaths(paths)) {
    istanbul = require('gulp-coffee-istanbul');
  } else {
    require('babel/register');
    istanbul = require('gulp-istanbul');
  }

  var testsPaths = paths.tests.concat(paths.noCoverageTests.map(function(item) {
    return '!' + item;
  }));

  gulp.src(paths.scripts)
    // .pipe(debug({
    //   title: 'starter!'
    // }))
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    })) // Force `require` to return covered files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function() {
      test(gulp, testsPaths, mochaOpts)
        .pipe(istanbul.writeReports({
          dir: paths.coverage,
          reportOpts: {
            dir: paths.coverage
          },
          reporters: ['text', 'text-summary', 'json', 'html', 'teamcity']
        }))
        .pipe(coverageEnforcer({
          thresholds: defaultCoverageThresholds,
          coverageDirectory: paths.coverage,
          rootDirectory: ''
        })).on('finish', cb).once('error', function() {
          process.exit(1);
        })
        .once('end', function() {
          process.exit();
        });
    });
}

gulp.task('test-all-coverage', function(cb) {
  var testServer = require('./tests/tasks/dummyServer')();
  coverageTest(function() {
    testServer.close();
    cb();
  }, defaultPaths)
});


gulp.task('default', ['grunt-jshint', 'test-all-coverage']);

/* jshint ignore:end */