'use strict';

/**
 * @ngdoc overview
 * @name workspaceApp
 * @description
 * # workspaceApp
 *
 * Main module of the application.
 */
angular.module('app', [
    'ui.router', 'ngResource'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('app', {
        url: '/',
        views:{
           'header': {
                templateUrl: 'views/header.html'
            },
            'content' :{
                templateUrl : 'views/main.html',
                controller: ''
            },
            'footer':{
                templateUrl: 'views/footer.html'
            }
        }
      })
      .state('app.runners', {
        url: 'runners',
        views:{
            'content@' :{
                templateUrl : 'views/runnersTable.html',
                controller: 'RunnersController as runnersCtrl'
            }
        }
      })
      .state('app.competitions', {
        url: 'competitions',
        views:{
            'content@' :{
                templateUrl : 'views/competitionsTable.html',
                controller: 'CompetitionsController as competitionsCtrl'
            }
            
        }
      });
      
      $urlRouterProvider.otherwise('/');
  });
  
