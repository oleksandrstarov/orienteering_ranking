'use strict';

angular.module('app')
.service('competitionsService',['$http', function($http){

    this.getData = function() {
        return $http.get('/competitions');
    }
}])

.service('runnerService',['$http', function($http){


    this.getRunner = function() {
        return $http.get('/runners');
    }
}]);