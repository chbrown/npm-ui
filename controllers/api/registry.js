/*jslint node: true */
var logger = require('loge');
var streaming = require('streaming');
var JSONStream = require('JSONStream');

var Router = require('regex-router');

var external = require('../../external');
var elasticsearch = require('../../elasticsearch');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

function normalizePerson(string) {
  var match = string.match(/([^<]+)(?: <([^>]+)>(?: \(([^)]+)\)))?/);
  return {
    name: match[1],
    email: match[2],
    url: match[3],
  };
}

function normalizePackage(obj) {
  // elasticsearch doesn't like how flexible CouchDB can be
  if (obj.license && typeof obj.license == 'string') {
    obj.license = {type: obj.license};
  }
  if (obj.repository && typeof obj.repository == 'string') {
    obj.repository = {url: obj.repository};
  }
  if (obj.bugs && typeof obj.bugs == 'string') {
    obj.bugs = {url: obj.bugs};
  }
  if (obj.author && typeof obj.author == 'string') {
    obj.author = normalizePerson(obj.author);
  }
  if (obj.contributors && typeof obj.contributors == 'string') {
    obj.contributors = normalizePerson(obj.contributors);
  }
  return obj;
}

/** POST /api/registry/loadAll
Reload registry from CouchDB source
*/
R.post('/api/registry/loadAll', function(req, res) {
  // res.setHeader('Content-Type', 'text/event-stream');

  // var insert = function(chunk, encoding, callback) {
  //   if (chunk.name) {
  //     // maybe don't wait for Elasticsearch?
  //     // inserting them in series is way too slow when streaming from CouchDB due to its ~3min timeout
  //     // callback(null, obj);
  //     chunk = normalizePackage(chunk);
  //     elasticsearch.client.index({
  //       method: 'PUT',
  //       index: 'npm',
  //       type: 'packages',
  //       id: chunk.name,
  //       body: chunk
  //     }, function(err, result) {
  //       if (err) {
  //         logger.error('Failed to index: %j', chunk);
  //         return callback(err);
  //       }
  //       callback(null, result);
  //     });
  //   }
  //   else {
  //     callback(null, {_updated: chunk});
  //   }
  // };

  var hasName = function(chunk, encoding, callback) {
    return chunk.name;
  };

  var insertBatch = function(chunk, encoding, callback) {
    var body = [];

    chunk.forEach(function(obj) {
      obj = normalizePackage(obj);
      body.push({ index: { _id: obj.name }}, obj);
    });

    elasticsearch.client.bulk({
      index: 'npm',
      type: 'packages',
      body: body
    }, function(err, result) {
      if (err) {
        logger.error('Failed to insert batch: %j', body);
        return callback(err);
      }

      var last_item = result.items[result.items.length - 1].index;
      callback(null, {
        took: result.took,
        errors: result.errors,
        count: result.items.length,
        last_item: last_item,
      });
    });
  };

  external.npm_registry.all()
  .on('error', function(err) {
    logger.error('request.get error: %j', err);
  })
  .on('end', function() {
    logger.debug('request.get end');
  })
  .pipe(JSONStream.parse('*'))
  .pipe(new streaming.Filter(hasName))
  .pipe(new streaming.Batcher(500))
  .pipe(new streaming.Transformer(insertBatch, {objectMode: true}))
  // .pipe(new streaming.Queue(10, insert, {objectMode: true}))
  .pipe(new streaming.json.Stringifier())
  // .pipe(new streaming.EventSource({objectMode: true}))
  .pipe(res);
});

module.exports = R.route.bind(R);
