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
    
     this.compareRunner = function() {
        return $resource('/runner/:id/:compare');
    };
}])
.service('statsService',['$resource', function($resource){
    this.getStats = function() {
        return $resource('/stats');
    };
}])
.service('adminCompetitionsService',['$resource', function($resource){
    this.getCompetitions = function() {
        return $resource('admin/competitions');
    };
    
    this.addLink = function() {
        return $resource('admin/competitions/addCompetition', null, {'update':{method: 'PUT'},'query': {method: 'GET', isArray: true }});
    };
    
    this.recalculateCompetitions = function() {
        return $resource('admin/competitions/recalculate', null, {'update':{method: 'PUT'},'query': {method: 'GET', isArray: true }});
    };
    
    this.dropData = function() {
        return $resource('admin/competitions/drop', null, {'update':{method: 'PUT'},'query': {method: 'GET', isArray: true }});
    };
    
    this.updateCompetition = function() {
        return $resource('admin/competitions/updateCompetitionDetails', null, {'update':{method: 'PUT'},'query': {method: 'GET', isArray: false }});
    };
  }])
  
.service('adminRunnersService', ['$resource', function($resource){
    this.getRunners = function() {
        return $resource('admin/runners');
    };
    this.mergeDuplicates = function(){
        return $resource('admin/runners/merge', null, {'update':{method:'PUT'},'query': {method: 'GET', isArray: false }});
    };
    this.updateRunner = function(){
        return $resource('admin/runners/update', null, {'update':{method:'PUT'},'query': {method: 'GET', isArray: false }});
    };
    
  }])
  
.service('loginService', ['$resource', function($resource){
    this.adminLogin = function() {
        return $resource('/adminLogin', null, {'check':{method:'PUT'}});
    };
  }])
  
.service('aboutService',['$resource', function($resource){
    this.getGoupsData = function() {
        return $resource('/about');
    };
}])
.value('runnersManValue', [])
.value('runnersWomanValue', [])
;