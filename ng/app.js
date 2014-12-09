/*jslint browser: true */ /*globals _, angular */
var app = angular.module('app', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'misc-js/angular-plugins',
]);

function sum(xs) {
  var total = 0;
  for (var i = 0, x; (x = xs[i]) !== undefined; i++) {
    total += x;
  }
  return total;
}

app.config(function($urlRouterProvider, $stateProvider, $locationProvider) {
  // The .otherwise() url is evaluated relative the to page's base[href] value,
  // so it should literally match the url of one of the states below.
  $urlRouterProvider.otherwise('/packages/');

  $stateProvider
  .state('packages', {
    abstract: true,
    url: '/packages',
    templateUrl: '/ng/packages/index.html',
  })
  .state('packages.list', {
    url: '/',
    templateUrl: '/ng/packages/list.html',
    controller: 'packages.list',
  })
  .state('packages.edit', {
    url: '/{name}',
    templateUrl: '/ng/packages/edit.html',
    controller: 'packages.edit'
  });

  $locationProvider.html5Mode(true);
});

app.service('Package', function($resource) {
  var Package = $resource('/packages/:name', {
    name: '@name',
  });

  Object.defineProperty(Package.prototype, 'version', {
    get: function() {
      // simply return the first key in the .versions field
      for (var key in this.versions) return key;
    },
  });

  Object.defineProperty(Package.prototype, 'authorString', {
    get: function() {
      // it appears that email is required if url is present
      // and name is required if email is present
      var parts = [];
      if (this.author && this.author.name) parts.push(this.author.name);
      if (this.author && this.author.email) parts.push('<' + this.author.email + '>');
      if (this.author && this.author.url) parts.push('(' + this.author.url + ')');
      return parts.join(' ');
    },
  });

  Object.defineProperty(Package.prototype, 'downloadsPerDay', {
    get: function() {
      var counts = _.values(this.downloads || {});
      return sum(counts) / counts.length;
    },
  });

  return Package;
});

app.controller('packages.list', function($scope, $http, $localStorage, Package) {
  $scope.$storage = $localStorage.$default({
    limit: 100,
    orderBy: '-_score',
  });

  $scope.thead = function(ev) {
    var key = ev.target.getAttribute('key');
    if (key) {
      $scope.$storage.orderBy = key;
    }
  };

  $scope.search = function(q, limit, ev) {
    $scope.packages = Package.query({q: q, limit: limit});
  };

  $scope.$watchCollection(['$storage.q', '$storage.limit'], function() {
    $scope.search($scope.$storage.q, $scope.$storage.limit);
  });
});

app.controller('packages.edit', function($scope, $state, Package) {
  $scope.package = Package.get($state.params);
});
