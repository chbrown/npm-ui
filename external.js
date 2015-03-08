var request = require('request');

var NpmRegistry = exports.NpmRegistry = function() {
  this.base = 'https://registry.npmjs.org';
};
NpmRegistry.prototype.all = function() {
  // returns http.request instance
  return request.get({
    url: this.base + '/-/all'
  });
};
exports.npm_registry = new NpmRegistry();

var NpmApi = exports.NpmApi = function() {
  this.base = 'https://api.npmjs.org';
};
NpmApi.prototype.downloads = function(package_name, callback) {
  /** Fetch the last month of downloads for a package

      package_name: string
      callback: (error: Error,
                 downloads: { [string]: number })

  `downloads` is an object where the keys are "YYYY-MM-DD" formatted, and the values are numbers
  */
  request.get({
    url: this.base + '/downloads/range/last-month/' + package_name,
    json: true,
  }, function (err, response, body) {
    if (err) return callback(err);
    if (body.error) {
      return callback(null, {});
    }
    // body.downloads is a list of objects like:
    //     {"day": "2014-11-08", "downloads": 154}
    var downloads = {};
    body.downloads.forEach(function(download) {
      downloads[download.day] = download.downloads;
    });
    callback(err, downloads);
  });
};
exports.npm_api = new NpmApi();

var GitHub = exports.GitHub = function(token) {
  this.base = 'https://api.github.com';
  this.token = token;
};
GitHub.prototype.counts = function(owner_name, repo_name, callback) {
  /** Fetch the current stars/watchers/forks for a repository on GitHub

      owner_name: string,
      repo_name: string
      callback: (error: Error,
                 downloads: { [string]: number })

  `downloads` is an object where the keys are "YYYY-MM-DD" formatted, and the values are numbers
  */
  request.get({
    url: this.base + '/repos/' + owner_name + '/' + repo_name,
    json: true,
    headers: {
      'User-Agent': 'chbrown/npm-ui',
      Authorization: 'token ' + this.token,
    }
  }, function (err, response, body) {
    if (err) return callback(err);

    var counts = {
      stargazers: body.stargazers_count,
      subscribers: body.subscribers_count,
      forks: body.forks_count,
    };

    callback(null, counts);
  });
};
exports.github = new GitHub(process.env.GITHUB_TOKEN);

