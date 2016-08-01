'use strict';

angular.module('app')
.controller('CompetitionsController', ['$scope', 'competitionsService', function($scope, competitionsService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';
    
    competitionsService.getCompetitions().query(
      function(response){
        self.info = response;
        $scope.isDataLoaded = true;
      },
      function(response){
        $scope.isDataLoaded = true;
        $scope.isError = true;
        $scope.message = response.status + '' + response.statusText;
      });
   
  
}])

.controller('CompetitionViewController', ['$scope', '$stateParams', 'competitionsService', function($scope, $stateParams, competitionsService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';
    
    competitionsService.getCompetition().get({id:parseInt($stateParams.id,10)})
    .$promise.then(
      function(response){
        self.info = response;
        $scope.isDataLoaded = true;
      },
      function(response){
        $scope.isDataLoaded = true;
        $scope.isError = true;
        $scope.message = response.status + '' + response.statusText;
      });
   
  
}])


.controller('RunnersController', ['$scope', 'runnerService', function($scope, runnerService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';
    
    runnerService.getRunners().query(
      function(response){
        $scope.isDataLoaded = true;
        self.info = response;
      
      },
      function(response){
        $scope.isDataLoaded = true;
        $scope.isError = true;
        $scope.message = response.status + '' + response.statusText;
        
      });
  
}])


.controller('RunnerViewController', ['$scope', '$stateParams', 'runnerService', function($scope, $stateParams, runnerService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';

    runnerService.getRunner().get({id:parseInt($stateParams.id,10)})
    .$promise.then(
      function(response){
        onSuccess(response, self, $scope);
      },
      function(response){
        onError(response, $scope);
      });
}])
;

function onSuccess(response, self, scope){
  scope.isDataLoaded = true;
  self.info = setTopResults(response);
};

function onError(response, scope){
  scope.isDataLoaded = true;
  scope.isError = true;
  scope.message = response.status + '' + response.statusText;
}

function setTopResults(data){
     
  for(var i = 0; i < data.results.length; i++){
    if(data.results[i].ACT_RESULT === 'C' && i < 6){
      data.results[i].POINTS_RANK = i + 1;
    }
    else{
      break;
    }
  }
  console.log(data);
  return data;
};