'use strict';

var through2 = require('through2');
var sourcemaps = require('gulp-sourcemaps');
var duplexify = require('duplexify');
var sink = require('./lib/sink');
var prepareWrite = require('./lib/prepare-write');
var writeContents = require('./lib/write-contents');

function store(outFolder, opt) {
  if (!opt) {
    opt = {};
  }

  function saveFile(file, enc, cb) {
    prepareWrite(outFolder, file, opt, function(err, writePath) {
      if (err) {
        return cb(err);
      }
      writeContents(writePath, file, cb);
    });
  }

  var saveStream = through2.obj(opt, saveFile);
  if (!opt.sourcemaps) {
    // Sink the save stream to start flowing
    // Do this on nextTick, it will flow at slowest speed of piped streams
    process.nextTick(sink(saveStream));

    return saveStream;
  }

  var sourcemapOpt = opt.sourcemaps;
  if (typeof sourcemapOpt === 'boolean') {
    sourcemapOpt = {};
  }
  if (typeof sourcemapOpt === 'string') {
    sourcemapOpt = {
      path: sourcemapOpt,
    };
  }

  var mapStream = sourcemaps.write(sourcemapOpt.path, sourcemapOpt);
  var outputStream = duplexify.obj(mapStream, saveStream);
  mapStream.pipe(saveStream);

  // Sink the output stream to start flowing
  // Do this on nextTick, it will flow at slowest speed of piped streams
  process.nextTick(sink(outputStream));

  return outputStream;
}

module.exports = store;
