'use strict';

angular.module('app')
.controller('CompetitionsController', ['$scope', 'competitionsService', function($scope, competitionsService) {
    var self = this;
    self.info=[];
    
    competitionsService.getCompetitions().query(
      function(response){
        self.info = response;
        
      },
      function(response){
        console.log(response.status + '' + response.statusText);
      });
   
  
}])

.controller('CompetitionViewController', ['$scope', '$stateParams', 'competitionsService', function($scope, $stateParams, competitionsService) {
    var self = this;
    self.info=[];
    
    competitionsService.getCompetition().get({id:parseInt($stateParams.id,10)})
    .$promise.then(
      function(response){
        self.info = response;
        console.log(response);
      },
      function(response){
        console.log(response.status + '' + response.statusText);
      });
   
  
}])


.controller('RunnersController', ['$scope', 'runnerService', function($scope, runnerService) {
    var self = this;
    self.info=[];
   
    runnerService.getRunners().query(
      function(response){
        self.info = response;
      
      },
      function(response){
        console.log(response.status + '' + response.statusText);
      });
  
}])


.controller('RunnerViewController', ['$scope', '$stateParams', 'runnerService', function($scope, $stateParams, runnerService) {
    var self = this;
    self.info=[];
    //self.fullName = 'Test';
    //console.log(self.info);
    runnerService.getRunner().get({id:parseInt($stateParams.id,10)})
    .$promise.then(
      function(response){
        self.info = response;
      },
      function(response){
        console.log(response.status + '' + response.statusText);
      });
  
}])
;