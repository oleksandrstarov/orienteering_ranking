'use strict';

app.controller('RunnersController', ['$scope', 'runnerService', function($scope, runnerService) {
    var self = this;
    self.info=[];
    console.log(self.info);
    runnerService.getRunner().success(function(data){
      self.info = data.runners;
      console.log(self.info);
    });
  
}]);
