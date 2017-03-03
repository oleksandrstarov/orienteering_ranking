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
   });