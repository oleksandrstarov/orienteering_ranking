'use strict';

app.controller('CompetitionsController', ['$scope', 'competitionsService', 'testValue', function($scope, competitionsService, testValue) {
    var self = this;
    self.info=[];
    
    competitionsService.getData().success(function(data){
      self.info = data;
      console.log(data);
      
    });
    console.log(testValue);
  
}]);
