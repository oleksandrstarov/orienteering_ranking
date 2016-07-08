'use strict';


app.directive('competitionsTable', function(){
    return {
        restict:'E',
        templateUrl: './views/competitionsTable.html',
        controller: 'CompetitionsController',
        controllerAs: 'competitionsCtrl'
    };
});