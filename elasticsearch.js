var request = require('request');
var elasticsearch = require('elasticsearch');

var client = exports.client = new elasticsearch.Client({
  host: 'elasticsearch:9200',
  log: 'error', // error | debug | trace
});
