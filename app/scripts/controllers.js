'use strict';

angular.module('app')
.controller('HomeController', ['$scope', 'statsService', function($scope, statsService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    //$timeout(function(){ $scope.isDataLoaded = true;}, 1000);
    $scope.isError = false;
    $scope.message = '';
    self.data ={};
    
    statsService.getStats().get().$promise.then(
      function(response){
        console.log(response);
        self.data = response.stats;
        $scope.isDataLoaded = true;
        
      },
      function(error){
        $scope.message = error.error;
        $scope.isError = true;
        $scope.isDataLoaded = true;
      });
  
}])


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
    self.manFilter = '';
    self.womanFilter = '';
    self.search = function(runner){
      if(runner.SEX === 'M'){
        var normalizedFilter = self.manFilter.toLowerCase();
        return runner.FULLNAME.toLowerCase().indexOf(normalizedFilter) != -1 || runner.TEAM.toLowerCase().indexOf(normalizedFilter) != -1;
      }else{
        var normalizedFilter = self.womanFilter.toLowerCase();
        return runner.FULLNAME.toLowerCase().indexOf(normalizedFilter) != -1 ||  runner.TEAM.toLowerCase().indexOf(normalizedFilter) != -1;
      }
    };
    
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
      
    self.getPlace = function(points, sex){
      console.log();
      var place = self.info.filter(function(runner){
        
        return runner.SEX === sex && runner.CUR_RANK < points;
      }).length;
      console.log(place);
      return place;
    }
    
    self.isSubjective = function(subjective){
      if(subjective === 'Y'){
        return 'subjective-points';
      }
      else return '';
    };
  
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
        console.log(response);
        onSuccess(response, self, $scope);
      },
      function(response){
        onError(response, $scope);
      });
}])

.controller('AboutController', ['$scope', function($scope) {
   $scope.showInfo = false;
   $scope.toggleInfo = function(){
     $scope.showInfo = !$scope.showInfo;
   }
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
  return data;
};