'use strict';


app.service('runnerService',['$http', function($http){


    this.getRunner = function() {
        return $http.get('./data/runners.json');
    }
}]);