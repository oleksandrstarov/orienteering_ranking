'use strict';

/**
 * @ngdoc overview
 * @name workspaceApp
 * @description
 * # workspaceApp
 *
 * Main module of the application.
 */
angular.module('app', ['ui.router', 'ngResource', 'ngMaterial', 'chart.js'])
  .config(function ($stateProvider, $urlRouterProvider, ChartJsProvider) {
    
    ChartJsProvider.setOptions({ chartColors : [ '#00ADF9', '#BD4C4C']});
    Chart.defaults.global.elements.point.radius = 0;
    Chart.defaults.global.elements.point.borderWidth = 0;
    Chart.defaults.global.elements.point.hitRadius = 3;
    
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
                    controller: 'AboutController as ctrl'
                }
            
        }
        
      })
      .state('app.adminRunners', {
            url: 'admin/runners',
            views:{
                'content@' :{
                    templateUrl : 'views/adminRunners.html',
                    controller:  'AdminRunnersController as AdminRunnersCtrl'
                }
            
        }
        
      })
      .state('app.adminCompetitions', {
            url: 'admin/competitions',
            views:{
                'content@' :{
                    templateUrl : 'views/adminCompetitions.html',
                    controller:  'AdminCompetitionsController as AdminCompCtrl'
                }
            
        }
        
      })
      ;
      
      $urlRouterProvider.otherwise('/');
      
    
   
  })
 
 ;
 
