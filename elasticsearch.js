/*jslint node: true */
var request = require('request');

var base = exports.base = 'http://localhost:9200';

var update = exports.update = function(index, type, id, doc, callback) {
  /** Update an object in Elasticsearch and return the response

      index: string
      type: string
      id: string
      doc: string
      callback: (error: Error,
                 object: {_index: string, _type: string, _id: any, _version: number})

  Rrference: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/docs-update.html
  */
  request.post({
    url: base + '/' + index + '/' + type + '/' + id + '/_update',
    body: {
      doc: doc
    },
    json: true,
  }, function(err, response, body) {
    callback(err, body);
  });
};

var insert = exports.insert = function(index, type, id, doc, callback) {
  request.put({
    url: base + '/' + index + '/' + type + '/' + id,
    body: doc,
    json: true, // json: true should (will?) trigger JSON serialization of body
  }, function(err, res, body) {
    // if (err) return callback(err);
    callback(err, body);
  });
};
