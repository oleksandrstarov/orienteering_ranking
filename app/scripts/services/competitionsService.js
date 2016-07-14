'use strict';


app.service('competitionsService',['$http', function($http){

    this.getData = function() {
        return $http.get('/competitions');
    }
}]);