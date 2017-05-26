'use strict';

angular.module('app')
 .directive('loaderTemplate', function(){
       return{
          restrict: 'E',
          templateUrl : 'views/templates/loader.html'
       };
   })
   .component('loginComponent', {
       templateUrl : 'views/templates/login.html',
       controller: 'LoginController'
   })
   .component('compareRunnersComponent', {
       templateUrl : 'views/templates/compareRunners.html',
       controller: 'CompareRunnersController as ctrl',
       bindings: {
        runner: '<',
        compareRunner: '<',
        compareData : '<',
        cancel: '&'
       }
   });