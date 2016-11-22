'use strict';

angular.module('app')
.service('competitionsService',['$resource', function($resource){

    this.getCompetitions = function() {
        return $resource('/competitions');
    };
    
    this.getCompetition = function() {
        return $resource('/competitions/:id');
    };
}])

.service('runnerService',['$resource', function($resource){
    this.getRunners = function() {
        return $resource('/runners');
    };
    
    this.getRunner = function() {
        return $resource('/runners/:id');
    };
}])
.service('statsService',['$resource', function($resource){
    this.getStats = function() {
        return $resource('/stats');
    };
}]);