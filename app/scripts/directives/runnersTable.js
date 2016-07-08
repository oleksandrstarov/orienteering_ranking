'use strict';

app.directive('runnersTable', function(){
    return {
        restict:'E',
        templateUrl: './views/runnersTable.html',
        controller: 'RunnersController',
        controllerAs: 'runnersCtrl'
    };
});