'use strict';

/**
 * @ngdoc overview
 * @name workspaceApp
 * @description
 * # workspaceApp
 *
 * Main module of the application.
 */
angular.module('adminApp', ['ui.router', 'ngResource'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('competitions', {
        url: '/competitions',
        views:{
           'content' :{
                templateUrl : 'adminCompetitions.html',
                controller: 'AdminCompetitionsController as AdminCompCtrl'
            }
        }
      })
      .state('runners', {
        url: '/runners',
        views:{
            'content' :{
                templateUrl : 'adminRunners.html',
                controller: 'AdminRunnersController as AdminRunnersCtrl'
            }
        }
      })
      ;
      
      $urlRouterProvider.otherwise('competitions');
  })
  
  .controller('AdminCompetitionsController', ['$scope', 'adminCompetitionsService', function($scope, service){
    $scope.newCompetition = '';
    var addUrlbtn = document.querySelector('#add-url');
    addUrlbtn.addEventListener('click', function(){
        console.log($scope.newCompetition);
        service.addLink().update({data: $scope.newCompetition});
        $scope.newCompetition = '';
    });
    
     var recalculatebtn = document.querySelector('#recalculate');
    recalculatebtn.addEventListener('click', function(){
        console.log('recalculate');
    });
    
     var dropbtn = document.querySelector('#drop');
    dropbtn.addEventListener('click', function(){
        console.log('drop');
        
    });
    
    var self = this;
    self.info=[];
    service.getCompetitions().query(
        function(response){
            console.log(response);
            self.info = response;
        },
        function(response){
            console.log(response.status + '' + response.statusText);
        }
    );
    
  }])
   .controller('AdminRunnersController',  ['$scope', 'adminRunnersService', function($scope, service){
    var self = this;
    $scope.info=[];
    self.selectedRunner = {};
    $scope.show = false;
   
    
    var mergebtn = document.querySelector('#merge');
    
    this.merge =  function(){
        console.log($scope.show);
        var selected = $scope.info.filter(function(runner){
            return runner.isSelected;
        });
        console.log(selected);
        console.log(self.selectedRunner);
        service.mergeDuplicates().update({main:self.selectedRunner, duplicates:selected});
        
        self.selectedRunner = {};
        $scope.show = false;
        
        for(var i =0; i < selected.length; i++){
            selected[i].isSelected = false;
        }
        
    };
    
   this.selected = function(runner){
     if(!runner.isSelected && runner === self.selectedRunner){
        $scope.show = false; 
        self.selectedRunner = {};
     }
   };
   this.selectedPrimary = function(runner){
       $scope.show = true;
   };
    
    

    service.getRunners().query(
        function(response){
            
            $scope.info = response;
        },
        function(response){
            console.log(response.status + '' + response.statusText);
        }
    );
  }])
  
  .service('adminCompetitionsService',['$resource', function($resource){
    this.getCompetitions = function() {
        return $resource('/competitions');
    };
    
    this.addLink = function() {
        return $resource('/competitions/update', null, {'update':{method: 'PUT'}});
    };
  }])
   .service('adminRunnersService', ['$resource', function($resource){
    this.getRunners = function() {
        return $resource('/runners');
    };
    this.mergeDuplicates = function(){
        return $resource('/runners/update', null, {'update':{method:'PUT'}});
    };
    
  }])
  
  /*.directive('loaderTemplate', function(){
       return{
          restrict: 'E',
          
          templateUrl : 'views/loader.html'
       };
   })*/
 ;
  
