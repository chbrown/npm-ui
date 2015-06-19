/// <reference path="./type_declarations/index.d.ts" />
import angular = require('angular');
import 'angular-resource';
import 'angular-ui-router';
import 'ngstorage';

var app = angular.module('app', [
  'ngResource',
  'ngStorage',
  'ui.router',
]);

app.config(($urlRouterProvider, $stateProvider, $locationProvider) => {
  $urlRouterProvider.otherwise(($injector, $location) => {
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

app.service('Package', ($resource, $localStorage) => {
  var Package = $resource(localStorage['searchServer'] + '/api/packages/:name', {
    name: '@name',
  });

  return Package;
});

app.controller('searchServer', ($scope) => {
  $scope.searchServer = localStorage['searchServer'] || 'http://localhost:8080';
  $scope.$watch('searchServer', (searchServer) => localStorage['searchServer'] = searchServer);
});

app.controller('packagesTableCtrl', ($scope, $http, $localStorage, Package) => {
  $scope.$storage = $localStorage.$default({
    q: 'npm search ui',
    size: 100,
    sort: '-averageDownloadsPerDay',
  });

  $scope.refresh = () => {
    $scope.packages = Package.query({
      q: $scope.$storage.q,
      size: $scope.$storage.size,
      sort: $scope.$storage.sort,
    });
  };

  $scope.$watchCollection(['$storage.q', '$storage.size', '$storage.sort'], () => {
    $scope.refresh();
  });
});

app.controller('packageDetailCtrl', ($scope, $state, Package) => {
  $scope.package = Package.get({name: $state.params.name});
});
