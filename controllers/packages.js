/*jslint node: true */
var stream = require('stream');
var url = require('url');

var async = require('async');
var request = require('request');
var _ = require('lodash');

var logger = require('loge');
var streaming = require('streaming');
var Router = require('regex-router');

var external = require('../external');
var elasticsearch = require('../elasticsearch');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

// function extendPackageWithDownloads(package_name, callback) {
//   /** Fetch the last month of downloads for a package and store the results in Elasticsearch
//       name: string
//       callback: (error: Error,
//                  object: {_index: string, _type: string, _id: any, _version: number})
//   */
//   external.npm_api.downloads(package_name, function(err, downloads) {
//     if (err) return callback(err);
//     // downloads is a { [string]: number } where the keys are "YYYY-MM-DD" formatted
//     var doc = {downloads: downloads};
//     elasticsearch.update('npm', 'packages', package_name, doc, callback);
//   });
// }

// function extendPackageWithStars(package_name, owner_name, repo_name, github_token, callback) {
//   /** Fetch the current stars / watchers / forks from GitHub and store the results in Elasticsearch
//       name: string
//       callback: (error: Error,
//                  object: {_index: string, _type: string, _id: any, _version: number})
//
//   TODO: handle cases where the package cannot be found on GitHub
//   */
//   external.github.counts(owner_name, repo_name, function(err, counts) {
//     if (err) return callback(err);
//     var doc = {github: counts};
//     elasticsearch.update('npm', 'packages', package_name, doc, callback);
//   });
// }

function enhancePackage(package, callback) {
  async.parallel([
    function githubEnhancement(callback) {
      // we might have already enhanced this package with github counts
      if (package.github !== undefined) return callback();
      // if not, let's try to extract the owner / repo information
      var repository_url = package.repository && package.repository.url || '';
      var github_match = repository_url.match(/github.com(\/|:)([\w-]+)\/([\w-]+)(.git)?/);
      // logger.info('github match in %s? %j', repository_url, github_match);
      // we can only do so if the repository url looks like a github url
      if (!github_match) return callback();

      var owner_name = github_match[2];
      var repo_name = github_match[3];
      logger.info('githubEnhancement: %s <- %s/%s', package.name, owner_name, repo_name);
      external.github.counts(owner_name, repo_name, function(err, counts) {
        if (err) return callback(err);

        var doc = {github: counts};
        _.extend(package, doc);
        elasticsearch.update('npm', 'packages', package.name, doc, callback);
      });
    },
    function downloadsEnhancement(callback) {
      // we might have already enhanced this package with downloads
      if (package.downloads !== undefined) return callback();

      logger.info('downloadsEnhancement: %s', package.name);
      // if not, all we need is the package name
      external.npm_api.downloads(package.name, function(err, downloads) {
        if (err) return callback(err);
        // downloads is a { [string]: number } where the keys are "YYYY-MM-DD" formatted
        var doc = {downloads: downloads};
        _.extend(package, doc);
        elasticsearch.update('npm', 'packages', package.name, doc, callback);
      });
    },
  ], function(err) {
    callback(err, package);
  });
}

/** GET /packages
  q=some+query
  limit=100
Show all packages matching a basic full text query
*/
R.get(/^\/packages\?/, function(req, res) {
  var urlObj = url.parse(req.url, true);

  // `npm` is the "_index", `packages` is the "_type"
  request.get({
    url: elasticsearch.base + '/npm/packages/_search',
    qs: {
      q: '_all:' + urlObj.query.q,
      size: urlObj.query.limit,
    },
    json: true,
  }, function(err, response, body) {
    if (err) return res.error(err);

    var hits = body.hits ? body.hits.hits : [];
    var packages = hits.map(function(hit) {
      return _.extend(hit._source, {_score: hit._score});
    });

    async.map(packages, enhancePackage, function(err, packages) {
      if (err) return res.error(err);
      res.json(packages);
    });
  });
});

/** GET /packages/:package_name
Show single package details
*/
R.get(/^\/packages\/(.+)$/, function(req, res, m) {
  request.get({
    url: elasticsearch.base + '/npm/packages/' + m[1],
    json: true,
  }, function(err, response, body) {
    if (err) return res.error(err);

    var package = body._source;


    res.json(body._source);
  });
});

module.exports = R.route.bind(R);
