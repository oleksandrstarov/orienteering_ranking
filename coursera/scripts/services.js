'use strict';

angular.module('confusionApp')
    .constant('baseURL', 'https://angular-coursera-oleksandrstarov.c9users.io/') 
    .service('menuFactory',['$resource', 'baseURL', function($resource, baseURL){
        
        
        
        this.getDishes = function(){
            return $resource(baseURL+'dishes/:id',null, {'update':{method:'PUT'}});
        };
        
        this.getPromotion = function(){
            return  $resource(baseURL+'promotions/:id');
        };

        
    }])
    
     .factory('corporateFactory',['$resource', 'baseURL', function($resource, baseURL){
    
            var corpfac = {};
            corpfac.getLeaders = function(){
                return $resource(baseURL+'leadership/:id');
            };
            
            return corpfac;
            
        }])
    
    .factory('feedbackFactory',['$resource', 'baseURL', function($resource, baseURL){
    
            var feedback = {};
            feedback.updateFeedback = function(){
                return $resource(baseURL+'feedback',null, {'update':{method:'PUT'}})
            };
            
            return feedback;
            
        }])

;