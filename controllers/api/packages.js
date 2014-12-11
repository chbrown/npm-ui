/*jslint node: true */
var stream = require('stream');
var url = require('url');

var async = require('async');
var request = require('request');
var _ = require('lodash');

var logger = require('loge');
var streaming = require('streaming');
var Router = require('regex-router');

var external = require('../../external');
var elasticsearch = require('../../elasticsearch');

var R = new Router(function(req, res) {
  res.status(404).die('No resource at: ' + req.url);
});

function sum(xs) {
  var total = 0;
  for (var i = 0, x; (x = xs[i]) !== undefined; i++) {
    total += x;
  }
  return total;
}

function enhancePackage(package, callback) {
  async.parallel([
    function githubEnhancement(callback) {
      // we might have already enhanced this package with github counts
      if (package.github !== undefined) return callback();
      // if not, let's try to extract the owner / repo information
      var repository_url = package.repository && package.repository.url || '';
      var github_match = repository_url.match(/github.com(\/|:)([\w-]+)\/([\w-]+)(.git)?/);
      // we can only do so if the repository url looks like a github url
      if (!github_match) return callback();
      // yay! a match. github_match, e.g. = [<the whole match>, ':', 'chbrown', 'npm-ui', '.git']
      var owner_name = github_match[2];
      var repo_name = github_match[3];
      logger.info('githubEnhancement: %s <- %s/%s', package.name, owner_name, repo_name);
      external.github.counts(owner_name, repo_name, function(err, counts) {
        if (err) return callback(err);

        var doc = {github: counts};

        _.extend(package, doc);
        elasticsearch.client.update({
          index: 'npm',
          type: 'packages',
          id: package.name,
          body: {
            doc: doc
          },
        }, callback);
      });
    },
    function downloadsEnhancement(callback) {
      // we might have already enhanced this package with downloads
      if (package.downloads !== undefined && package.averageDownloadsPerDay !== undefined) return callback();

      logger.info('downloadsEnhancement: %s', package.name);
      // if not, all we need is the package name
      external.npm_api.downloads(package.name, function(err, downloads) {
        if (err) return callback(err);
        // downloads is a { [string]: number } where the keys are "YYYY-MM-DD" formatted

        var download_counts = _.values(downloads);
        var averageDownloadsPerDay = (download_counts.length === 0) ? 0 : (sum(download_counts) / download_counts.length);

        var doc = {
          downloads: downloads,
          averageDownloadsPerDay: averageDownloadsPerDay,
        };

        _.extend(package, doc);
        elasticsearch.client.update({
          index: 'npm',
          type: 'packages',
          id: package.name,
          body: {
            doc: doc
          },
        }, callback);
      });
    },
  ], function(err) {
    callback(err, package);
  });
}

/** GET /api/packages
  q=some+query
  size=100
  sort=_score:desc
Show all packages matching a basic full text query
*/
R.get(/^\/api\/packages\?/, function(req, res) {
  var urlObj = url.parse(req.url, true);

  var sort = {};
  sort[urlObj.query.sort] = 'desc';

  elasticsearch.client.search({
    index: 'npm',
    type: 'packages',
    // q: '_all:' +  urlObj.query.q,
    // size: urlObj.query.size,
    // sort: urlObj.query.sort,
    body: {
      query: {
        filtered: {
          filter: {
            exists: {
              // exclude unpublished (unversioned) packages
              field: 'dist-tags'
            },
            // range: {
            //   averageDownloadsPerDay: {
            //     gt: 0
            //   }
            // }
          },
          query: {
            // multi_match: {
            //   query: urlObj.query.q,
            //   fields: ['name', 'description', 'keywords']
            // },
            match: {
              _all: urlObj.query.q,
            },
          },
        },
      },
      size: urlObj.query.size,
      sort: [
        sort
      ],
    },
  }, function(err, result) {
    if (err) return res.error(err);

    var hits = result.hits ? result.hits.hits : [];
    var packages = hits.map(function(hit) {
      return _.extend(hit._source, {_score: hit._score});
    });

    async.map(packages, enhancePackage, function(err, packages) {
      if (err) return res.error(err);
      res.ngjson(packages);
    });
  });
});

/** GET /api/packages/:package_name
Show single package details
*/
R.get(/^\/api\/packages\/(.+)$/, function(req, res, m) {
  elasticsearch.client.get({
    index: 'npm',
    type: 'packages',
    id: m[1]
  }, function(err, result) {
    if (err) return res.error(err, req.headers);

    res.json(result._source);
  });
});

module.exports = R.route.bind(R);
