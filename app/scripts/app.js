'use strict';

/**
 * @ngdoc overview
 * @name workspaceApp
 * @description
 * # workspaceApp
 *
 * Main module of the application.
 */
angular.module('app', ['ui.router', 'ngResource'])
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
                controller: 'HomeController as homeCtrl'
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
      .state('app.runner', {
        url: 'runners/:id',
        views:{
            'content@' :{
                templateUrl : 'views/runnerView.html',
                controller: 'RunnerViewController as runnerViewCtrl'
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
      })
      .state('app.competition', {
        url: 'competitions/:id',
        views:{
            'content@' :{
                templateUrl : 'views/competitionView.html',
                controller: 'CompetitionViewController as competitionViewCtrl'
            }
            
        }
      })
       .state('app.about', {
            url: 'about',
            views:{
                'content@' :{
                    templateUrl : 'views/about.html',
                    controller: 'AboutController as aboutController'
                }
            
        }
      })
      ;
      
      $urlRouterProvider.otherwise('/');
  })
  .directive('loaderTemplate', function(){
       return{
          restrict: 'E',
          
          templateUrl : 'views/loader.html'
       };
   })
 ;
  
