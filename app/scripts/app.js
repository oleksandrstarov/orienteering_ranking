'use strict';

/**
 * @ngdoc overview
 * @name workspaceApp
 * @description
 * # workspaceApp
 *
 * Main module of the application.
 */
var app = angular.module('app', [
    'ngRoute'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/competitions', {
        template: '<competitions-table></competitions-table>'
      })
       .when('/runners', {
        template: '<runners-table></runners-table>'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .value('testValue', 333);
