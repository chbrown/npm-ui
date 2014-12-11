/*jslint browser: true */ /*globals _, angular */
var app = angular.module('app', [
  'ngResource',
  'ngStorage',
  'ui.router',
  'misc-js/angular-plugins',
]);

app.config(function($urlRouterProvider, $stateProvider, $locationProvider) {
  $urlRouterProvider.otherwise('/packages/');

  $stateProvider
  .state('packages', {
    url: '/packages/',
    templateUrl: '/ng/packages/table.html',
    controller: 'packagesTableCtrl',
  })
  .state('package', {
    url: '/packages/{name}',
    templateUrl: '/ng/packages/detail.html',
    controller: 'packageDetailCtrl'
  });

  $locationProvider.html5Mode(true);
});

app.run(function($rootScope, $localStorage) {
  $rootScope.$storage = $localStorage.$default({
    q: 'npm search ui',
    size: 100,
    sort: 'averageDownloadsPerDay',
    package_history: [],
  });
});

app.service('Package', function($resource) {
  var Package = $resource('/api/packages/:name', {
    name: '@name',
  });

  // Object.defineProperty(Package.prototype, 'authorString', {
  //   get: function() {
  //     // it appears that email is required if url is present
  //     // and name is required if email is present
  //     var parts = [];
  //     if (this.author && this.author.name) parts.push(this.author.name);
  //     if (this.author && this.author.email) parts.push('<' + this.author.email + '>');
  //     if (this.author && this.author.url) parts.push('(' + this.author.url + ')');
  //     return parts.join(' ');
  //   },
  // });

  return Package;
});

app.factory('packageHistoryManager', function($localStorage) {
  // handles manipulating $localStorage.package_history properly
  return {
    add: function(package_name) {
      if ($localStorage.package_history.indexOf(package_name) === -1) {
        // if it's not already in `package_history`, add it at the beginning
        $localStorage.package_history.unshift(package_name);
        // and truncate the resulting array if it's too long
        $localStorage.package_history.length = Math.min($localStorage.package_history.length, 5);
      }
    },
  };
});


app.controller('packagesTableCtrl', function($scope, $http, $localStorage, Package) {
  // $scope.thead = function(ev) {
  //   var key = ev.target.getAttribute('key');
  //   if (key) {
  //     $scope.$storage.orderBy = key;
  //   }
  // };

  $scope.refresh = function() {
    $scope.packages = Package.query({
      q: $scope.$storage.q,
      size: $scope.$storage.size,
      sort: $scope.$storage.sort,
    });
  };

  $scope.$watchCollection(['$storage.q', '$storage.size', '$storage.sort'], function() {
    $scope.refresh();
  });
});

app.controller('packageDetailCtrl', function($scope, $state, Package, packageHistoryManager) {
  $scope.package = Package.get({name: $state.params.name});

  packageHistoryManager.add($state.params.name);
});
