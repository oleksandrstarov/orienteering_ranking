'use strict';


angular.module('app')
    .service('homeService', [function(){
        this.getData = function(){
            return {name: 'Hello', value: 2};
        };
        
    }]);