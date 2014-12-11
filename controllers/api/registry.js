/*jslint node: true */
var streaming = require('streaming');
var JSONStream = require('JSONStream');

var Router = require('regex-router');

var external = require('../../external');
var elasticsearch = require('../../elasticsearch');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

/** POST /registry/loadAll
Reload registry from CouchDB source
*/
R.post('/registry/loadAll', function(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');

  var insert = function(chunk, encoding, callback) {
    if (chunk.name) {
      // maybe don't wait for Elasticsearch?
      // inserting them in series is way too slow when streaming from CouchDB due to its ~3min timeout
      // callback(null, obj);
      elasticsearch.client.insert({
        index: 'npm',
        type: 'packages',
        id: chunk.name,
        body: chunk
      }, callback);
    }
    else {
      callback(null, {_updated: chunk});
    }
  };

  external.npm_registry.all()
  .on('error', function(err) {
    console.log('request.get error: %j', err);
  })
  .on('end', function() {
    console.log('request.get end');
  })
  .pipe(JSONStream.parse('*'))
  .pipe(new streaming.Transformer(insert, {objectMode: true}))
  // .pipe(new streaming.Queue(10, insert, {objectMode: true}))
  .pipe(new streaming.json.Stringifier())
  // .pipe(new streaming.EventSource({objectMode: true}))
  .pipe(res);
});

module.exports = R.route.bind(R);
