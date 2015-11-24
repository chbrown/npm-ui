import angular = require('angular');
import 'angular-ui-router';
import 'ngstorage';
import 'flow-copy';

var app = angular.module('app', [
  'ui.router',
  'ngStorage',
  'flow-copy',
]);

app.filter('decodeURIComponent', () => decodeURIComponent);

function px(length: number, fractionDigits = 3) {
  return length.toFixed(fractionDigits) + 'px';
}
app.filter('px', () => px);

function percent(length: number, fractionDigits = 3) {
  return length.toFixed(fractionDigits) + '%';
}
app.filter('percent', () => percent);

app.config(($urlRouterProvider, $stateProvider, $locationProvider) => {
  $urlRouterProvider.otherwise(($injector, $location) => {
    return '/packages';
  });

  $stateProvider
  .state('config', {
    url: '/config?errorUrl&fromUrl',
    templateUrl: 'templates/config.html',
    controller: 'configCtrl',
  })
  .state('packages', {
    url: '/packages',
    templateUrl: 'templates/packages.html',
    controller: 'packagesTableCtrl',
  })
  .state('package', {
    url: '/packages/{name}',
    templateUrl: 'templates/package.html',
    controller: 'packageDetailCtrl'
  });
});

app.config($httpProvider => {
  $httpProvider.interceptors.push(($q, $rootScope) => {
    return {
      responseError: res => {
        $rootScope.$broadcast('httpResponseError', res);
        return $q.reject(res);
      },
    };
  });
});

app.run(($rootScope, $state, $timeout) => {
  $rootScope.$on('httpResponseError', (ev, res) => {
    var fromUrl = $state.href($state.current);
    $timeout(() => {
      $state.go('config', {errorUrl: res.config.url, fromUrl: fromUrl});
    });
  });
});

app.controller('configCtrl', ($scope, $state, $localStorage) => {
  $scope.errorUrl = $state.params.errorUrl;
  $scope.fromUrl = $state.params.fromUrl;
  $scope.$storage = $localStorage.$default({
    searchServer: 'http://npm-search-server',
    historyServer: 'http://npm-history',
  });
});

app.controller('packagesTableCtrl', ($scope, $http, $state, $localStorage) => {
  $scope.$storage = $localStorage.$default({
    q: 'npm search ui',
    downloadsFactor: '0.1',
    size: 100,
  });

  $scope.refresh = () => {
    $scope.search_status = `Searching for "${$scope.$storage.q}"`;
    $http({
      method: 'GET',
      url: `${$localStorage.searchServer}/packages`,
      params: {
        q: $scope.$storage.q,
        downloadsFactor: $scope.$storage.downloadsFactor,
        size: $scope.$storage.size,
      },
    }).then(res => {
      var content_range = res.headers('Content-Range');
      var content_range_match = content_range.match(/^packages (\d+)-(\d+)\/(\d+)$/);
      var total = content_range_match ? content_range_match[3] : 'NA';
      $scope.packages = res.data;
      $scope.search_status = `Showing ${res.data.length} out of ${total} results`;
    });
  };

  $scope.$watchCollection(['$storage.q', '$storage.downloadsFactor', '$storage.size'], () => {
    $scope.refresh();
  });
});

app.controller('packageDetailCtrl', ($scope, $http, $state, $localStorage) => {
  $http({
    method: 'GET',
    url: `${$localStorage.searchServer}/packages/${$state.params.name}`,
  }).then(res => {
    $scope.package = res.data;

    // http://npm-history.henrian.com/packages/semver/downloads
    $http({
      method: 'GET',
      url: `${$localStorage.historyServer}/packages/${$state.params.name}/downloads`,
    }).then(res => {
      // res.data is an Array of {day: string, downloads: number} objects
      var stats = res.data.filter(stat => stat.downloads > 0);
      $scope.download_width = percent(100 / stats.length, 5);
      $scope.max_downloads = Math.max.apply(null, stats.map(stat => stat.downloads))
      $scope.package.stats = stats;
    });
  });
});
