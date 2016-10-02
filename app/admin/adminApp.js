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
    var self = this;
    self.info=[];
    $scope.message = '';
    $scope.newCompetition = '';
   
    
    $scope.addCompetition =  function(){
        $scope.message = 'Adding...';
        console.log($scope.newCompetition);
        if(!$scope.newCompetition){
            $scope.message = 'Empty link!';
            return;
            
        }
        service.addLink().update({data: $scope.newCompetition}, function(response){
            if(!response.error){
                self.info.push(mapValue([response.data]));    
            }
            $scope.message = response.error || 'Competition added';
        });
        $scope.newCompetition = '';
    };
    
    
    $scope.recalculate = function(){
        $scope.message = 'Recalculation...';
        service.recalculateCompetitions().update({data: self.info}, function(response){
            if(!response.error){
                
                self.info = mapValue(JSON.parse(response.data));
                
                //item.selected prop
            }
            $scope.message = response.error || 'Competitions updated';
        });
        $scope.newCompetition = '';
    };
    
    $scope.updateCompetition = function(){
        $scope.message = 'Updating...';
        service.updateCompetition().update({data:{id:self.selectedCompetition.ID, title:self.selectedCompetition.NAME}},
        function(response){
            $scope.message = response.data || 'Data updated';
        });
    };
    
    
    self.info=[];
    service.getCompetitions().query(
        function(response){
            self.info = mapValue(response);
        },
        function(response){
            $scope.message = response.status + '' + response.statusText;
        }
    );
    function mapValue(arr){
        return arr.map(function(item){
                item.IS_ALLOWED_UPDATED = item.IS_ALLOWED;
                return item;
            }); 
    };
    
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
        return $resource('/competitions/addCompetition', null, {'update':{method: 'PUT'},'query': {method: 'GET', isArray: true }});
    };
    
    this.recalculateCompetitions = function() {
        return $resource('/competitions/recalculate', null, {'update':{method: 'PUT'},'query': {method: 'GET', isArray: true }});
    };
    
    this.updateCompetition = function() {
        return $resource('/competitions/updateCompetitionDetails', null, {'update':{method: 'PUT'},'query': {method: 'GET', isArray: false }});
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
  
