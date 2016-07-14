'use strict';
angular.module('confusionApp', ['ui.router', 'ngResource'])
   .config(function($stateProvider, $urlRouterProvider){
        $stateProvider
    .state('app', {
        url:'/',
        views:{
            'header': {
                templateUrl: 'views/header.html'
            },
            'content' :{
                templateUrl : 'views/home.html',
                controller: 'IndexController'
            },
            'footer':{
                templateUrl: 'views/footer.html'
            }
        }
    })
    
    .state('app.aboutus', {
        url:'aboutus',
        views:{
            'content@':{
                templateUrl: 'views/aboutus.html',
                controller: 'AboutController'
            }
            
        }
    })
    
    .state('app.contactus', {
        url:'contactus',
        views:{
            'content@':{
                templateUrl: 'views/contactus.html',
                controller: 'ContactController'
            }
            
        }
    })
    
    .state('app.menu', {
        url: 'menu',
        views: {
            'content@': {
                templateUrl : 'views/menu.html',
                controller  : 'MenuController'
            }
        }
    })

    // route for the dishdetail page
    .state('app.dishdetails', {
        url: 'menu/:id',
        views: {
            'content@': {
                templateUrl : 'views/dishdetail.html',
                controller  : 'DishDetailController'
           }
        }
    });
    
    $urlRouterProvider.otherwise('/');
       
   })
    
;

/*angular.module('confusionApp', ['ngRoute'])

    .config(function($routeProvider){
        $routeProvider
        
        .when('/contactus', {
            templateUrl : 'contactus.html',
            controller : 'ContactController'
        })
        
        .when('/menu', {
            templateUrl : 'menu.html',
            controller : 'MenuController'
        })
        
        .when('/menu/:id', {
            templateUrl : 'dishdetail.html',
            controller : 'DishDetailController'
        })
        
        .otherwise('/contactus');
    })
;*/