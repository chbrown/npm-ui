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
app.config(function ($urlRouterProvider, $stateProvider, $locationProvider) {
    $urlRouterProvider.otherwise(function ($injector, $location) {
        return '/';
    });
    $stateProvider
        .state('packages', {
        url: '/',
        templateUrl: 'templates/table.html',
        controller: 'packagesTableCtrl',
    })
        .state('package', {
        url: '/packages/{name}',
        templateUrl: 'templates/detail.html',
        controller: 'packageDetailCtrl'
    });
    // $locationProvider.html5Mode({enabled: false, requireBase: false});
});
app.service('Package', function ($resource, $localStorage) {
    var Package = $resource(localStorage['searchServer'] + '/api/packages/:name', {
        name: '@name',
    });
    return Package;
});
app.controller('searchServer', function ($scope) {
    $scope.searchServer = localStorage['searchServer'] || 'http://localhost:8080';
    $scope.$watch('searchServer', function (searchServer) { return localStorage['searchServer'] = searchServer; });
});
app.controller('packagesTableCtrl', function ($scope, $http, $localStorage, Package) {
    $scope.$storage = $localStorage.$default({
        q: 'npm search ui',
        size: 100,
        sort: 'averageDownloadsPerDay',
    });
    $scope.refresh = function () {
        $scope.packages = Package.query({
            q: $scope.$storage.q,
            size: $scope.$storage.size,
            sort: $scope.$storage.sort,
        });
    };
    $scope.$watchCollection(['$storage.q', '$storage.size', '$storage.sort'], function () {
        $scope.refresh();
    });
});
app.controller('packageDetailCtrl', function ($scope, $state, Package) {
    $scope.package = Package.get({ name: $state.params.name });
});
