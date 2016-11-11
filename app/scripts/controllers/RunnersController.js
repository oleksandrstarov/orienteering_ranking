'use strict';

app.controller('RunnersController', ['$scope', 'runnerService', function($scope, runnerService) {
    var self = this;
    self.info=[];
    runnerService.getRunner().success(function(data){
      self.info = data;
      console.log(self.info);
    });
  
}]);
