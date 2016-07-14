'use strict';

angular.module('app')
.controller('CompetitionsController', ['$scope', 'competitionsService', function($scope, competitionsService) {
    var self = this;
    self.info=[];
    
    competitionsService.getData().success(function(data){
      self.info = data;
      console.log(data);
      
    });
   
  
}])


.controller('RunnersController', ['$scope', 'runnerService', function($scope, runnerService) {
    var self = this;
    self.info=[];
    console.log(self.info);
    runnerService.getRunner().success(function(data){
      self.info = data;
      console.log(self.info);
    });
  
}]);