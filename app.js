/// <reference path="./type_declarations/index.d.ts" />
var angular = require('angular');
require('angular-resource');
require('angular-ui-router');
require('ngstorage');
var app = angular.module('app', [
    'ngResource',
    'ngStorage',
    'ui.router',
]);
app.filter('decodeURIComponent', function () { return decodeURIComponent; });
function px(length, fractionDigits) {
    if (fractionDigits === void 0) { fractionDigits = 3; }
    return length.toFixed(fractionDigits) + 'px';
}
app.filter('px', function () { return px; });
function percent(length, fractionDigits) {
    if (fractionDigits === void 0) { fractionDigits = 3; }
    return length.toFixed(fractionDigits) + '%';
}
app.filter('percent', function () { return percent; });
app.config(function ($urlRouterProvider, $stateProvider, $locationProvider) {
    $urlRouterProvider.otherwise(function ($injector, $location) {
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
app.config(function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q, $rootScope) {
        return {
            responseError: function (res) {
                $rootScope.$broadcast('httpResponseError', res);
                return $q.reject(res);
            },
        };
    });
});
app.run(function ($rootScope, $state, $timeout) {
    $rootScope.$on('httpResponseError', function (ev, res) {
        var fromUrl = $state.href($state.current);
        $timeout(function () {
            $state.go('config', { errorUrl: res.config.url, fromUrl: fromUrl });
        });
    });
});
app.controller('configCtrl', function ($scope, $state, $localStorage) {
    $scope.errorUrl = $state.params.errorUrl;
    $scope.fromUrl = $state.params.fromUrl;
    $scope.$storage = $localStorage.$default({
        searchServer: 'http://npm-search-server',
        historyServer: 'http://npm-history',
    });
});
app.controller('packagesTableCtrl', function ($scope, $http, $state, $localStorage) {
    $scope.$storage = $localStorage.$default({
        q: 'npm search ui',
        downloadsFactor: '0.1',
        size: 100,
    });
    $scope.refresh = function () {
        $http({
            method: 'GET',
            url: $localStorage.searchServer + "/packages",
            params: {
                q: $scope.$storage.q,
                downloadsFactor: $scope.$storage.downloadsFactor,
                size: $scope.$storage.size,
            },
        }).then(function (res) {
            $scope.packages = res.data;
        });
    };
    $scope.$watchCollection(['$storage.q', '$storage.downloadsFactor', '$storage.size'], function () {
        $scope.refresh();
    });
});
app.controller('packageDetailCtrl', function ($scope, $http, $state, $localStorage) {
    $http({
        method: 'GET',
        url: $localStorage.searchServer + "/packages/" + $state.params.name,
    }).then(function (res) {
        $scope.package = res.data;
        // http://npm-history.henrian.com/packages/semver/downloads
        $http({
            method: 'GET',
            url: $localStorage.historyServer + "/packages/" + $state.params.name + "/downloads",
        }).then(function (res) {
            // res.data is an Array of {day: string, downloads: number} objects
            var stats = res.data.filter(function (stat) { return stat.downloads > 0; });
            $scope.download_width = percent(100 / stats.length, 5);
            $scope.max_downloads = Math.max.apply(null, stats.map(function (stat) { return stat.downloads; }));
            $scope.package.stats = stats;
        });
    });
});
