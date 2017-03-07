'use strict';

angular.module('app')
.controller('HomeController', ['$scope', 'statsService', function($scope, statsService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    //$timeout(function(){ $scope.isDataLoaded = true;}, 1000);
    $scope.isError = false;
    $scope.message = '';
    self.data ={};
    
    statsService.getStats().get().$promise.then(
      function(response){
        
        self.data = response.stats;
        $scope.isDataLoaded = true;
        
      },
      function(error){
        $scope.message = error.error;
        $scope.isError = true;
        $scope.isDataLoaded = true;
      });
  
}])


.controller('CompetitionsController', ['$scope', 'competitionsService', function($scope, competitionsService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';
    
    competitionsService.getCompetitions().query(
      function(response){
        self.info = response;
        $scope.isDataLoaded = true;
      },
      function(response){
        $scope.isDataLoaded = true;
        $scope.isError = true;
        $scope.message = response.status + '' + response.statusText;
      });
   
  
}])

.controller('CompetitionViewController', ['$scope', '$stateParams', 'competitionsService', function($scope, $stateParams, competitionsService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';
    
    competitionsService.getCompetition().get({id:parseInt($stateParams.id,10)})
    .$promise.then(
      function(response){
        response.details[0].runners = response.results.length;
        response.results = groupResults(response.results);
        self.info = response;
        $scope.isDataLoaded = true;
      },
      function(response){
        $scope.isDataLoaded = true;
        $scope.isError = true;
        $scope.message = response.status + '' + response.statusText;
      });
   
    function groupResults(resultsList){
      if(resultsList.length === 0){
        return null;
      }
      var groups = [[]];
      var group = resultsList[0].COMP_GROUP;
      
      for(var i=0; i<resultsList.length; i++){
        if(resultsList[i].COMP_GROUP === group){
          groups[groups.length-1].push(resultsList[i]);
        }else{
          groups.push([resultsList[i]]);
          group = resultsList[i].COMP_GROUP;
        }
      }
      return groups;
    };
  
}])

.controller('RunnersController', ['$scope', 'runnerService', function($scope, runnerService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';
    self.manFilter = '';
    self.womanFilter = '';
    self.manShift = null;
    self.womanShift = null;
    
    self.search = function(runner){
      if(runner.SEX === 'M'){
        var normalizedFilter = self.manFilter.toLowerCase();
        return runner.FULLNAME.toLowerCase().indexOf(normalizedFilter) != -1 || runner.TEAM.toLowerCase().indexOf(normalizedFilter) != -1;
      }else{
        var normalizedFilter = self.womanFilter.toLowerCase();
        return runner.FULLNAME.toLowerCase().indexOf(normalizedFilter) != -1 ||  runner.TEAM.toLowerCase().indexOf(normalizedFilter) != -1;
      }
    };
    
    self.subjectiveFilter = function(runner){
      if(runner.SEX === 'M'){
        return self.noSubjectiveMan? runner.SUBJECTIVE !=='Y': true;
      }else{
        return self.noSubjectiveWoman? runner.SUBJECTIVE !=='Y': true;
      }
    };
    
    runnerService.getRunners().query(
      function(response){
        //console.log(response);
        $scope.isDataLoaded = true;
        setShift(response);
        self.info = response;
      
      },
      function(response){
        //console.log(response);
        $scope.isDataLoaded = true;
        $scope.isError = true;
        $scope.message = response.status + '' + response.statusText;
      });
      
    self.getPlace = function(points, sex){
    
      var place = self.info.filter(function(runner){
        
        return runner.SEX === sex && runner.CUR_RANK < points;
      }).length;
      
      return place;
    }
    
    self.isSubjective = function(subjective){
      if(subjective === 'Y'){
        return 'subjective-points';
      }
      else return '';
    };
    
    function setShift(runners){
      var index = 0;
      while(self.manShift === null || self.womanShift === null){
        if(runners[index].SEX === 'M' && self.manShift === null ){
          self.manShift = -runners[index].CUR_RANK;
        }
        if(runners[index].SEX === 'W' && self.womanShift === null ){
          self.womanShift = -runners[index].CUR_RANK;
        }
        index++;
      }
    }
  
}])

.controller('RunnerViewController', ['$scope', '$stateParams', 'runnerService', function($scope, $stateParams, runnerService) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';

    runnerService.getRunner().get({id:parseInt($stateParams.id,10)})
    .$promise.then(
      function(response){
        drawChart(response.stats, response.details[0].FULLNAME);
        onSuccess(response, self, $scope);
      },
      function(response){
        onError(response, $scope);
      });
      
      function drawChart(data, name){
       //Chart.defaults.global.defaultFontSize = 12;
       
        var labels = data.map(function(entry){
         
          return entry.ENTRY_DATE.slice(0, entry.ENTRY_DATE.indexOf('T'));
          
        });
        
        var points = data.map(function(entry){
          return entry.POINTS;
        });
        
        var places = data.map(function(entry){
          return entry.PLACE;
        });
        
        //http://jtblin.github.io/angular-chart.js/
        $scope.labels = labels;
        $scope.series = ['очки', 'место'];
        $scope.data = [points, places];
        
        $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
        
        $scope.options = {
          scales: {
            yAxes: [
              {
                id: 'y-axis-1',
                type: 'linear',
                display: true,
                position: 'left'
              },
              {
                id: 'y-axis-2',
                type: 'linear',
                display: true,
                position: 'right',
                ticks: {
                    min: 1
                }
              }
            ]
          }
        };
      }
}])

.controller('AboutController', ['aboutService', '$scope', function(aboutService, $scope) {
  var self = this;
  self.groups = '(Загрузка..)';
  $scope.isDataLoaded = false;
  
  $scope.showInfo = false;
  $scope.toggleInfo = function(){
    $scope.showInfo = !$scope.showInfo;
  };
   
  aboutService.getGoupsData().query(
    function(response){
      self.groups = response.map(function(item){
        return item.name;
      }).join(', ');
      self.points = response;
      $scope.isDataLoaded = true;
    },
    function(response){
      $scope.isDataLoaded = true;
      $scope.isError = true;
      $scope.message = response.status + '' + response.statusText;
    });
}])

.controller('LoginController', ['$mdDialog', '$mdMedia', '$mdToast','$state', function($mdDialog, $mdMedia, $mdToast, $state) {
   var customFullscreen = false;

   this.showPrompt = function(event) {
    // Appending dialog to document.body to cover sidenav in docs app
    
    $mdDialog.show({
        clickOutsideToClose:true,
        controller: 'LoginDialogController as ctrl',
        templateUrl:'views/templates/loginPopup.html',
        parent: angular.element(document.body),
        targetEvent: event,
        fullscreen: customFullscreen
    }).then(function(result) {
        $state.go(result.adminPanel);
    }, function() {
      console.log('cancel');
    });
  }
}])
.controller('AdminCompetitionsController', ['$scope', 'adminCompetitionsService', '$state', function($scope, service, $state){
    var self = this;
    self.info=[];
    $scope.message = '';
    $scope.newCompetition = '';
   
    
    $scope.addCompetition =  function(){
        $scope.message = 'Adding...';
       
        if(!$scope.newCompetition){
            $scope.message = 'Empty link!';
            return;
            
        }
        service.addLink().update({data: $scope.newCompetition}, function(response){
            if(!response.error){
                self.info.push(mapValue([response.data]));    
            }
            $scope.message = response.error || 'Competition added';
        });
        $scope.newCompetition = '';
    };
    
    
    $scope.recalculate = function(){
        $scope.message = 'Recalculation...';
        service.recalculateCompetitions().update({data: self.info}, function(response){
            if(!response.error){
                
                self.info = mapValue(JSON.parse(response.data));
                
                //item.selected prop
            }
            $scope.message = response.error || 'Competitions updated';
        });
        $scope.newCompetition = '';
    };
    
    $scope.updateCompetition = function(){
        $scope.message = 'Updating...';
        service.updateCompetition().update({data:{id:self.selectedCompetition.ID, title:self.selectedCompetition.NAME}},
        function(response){
            $scope.message = response.data || 'Data updated';
        });
    };
    
    
    self.info=[];
    service.getCompetitions().query(
        function(response){
          
          self.info = mapValue(response);
        },
        function(response){
          if(response.status === 401){
            $state.go('app');
          }else{
            $scope.message = response.status + '' + response.statusText;
          }
          
        }
    );
    function mapValue(arr){
        return arr.map(function(item){
                item.IS_ALLOWED_UPDATED = item.IS_ALLOWED;
                return item;
            }); 
    };
    
  }])
.controller('AdminRunnersController',  ['$scope', 'adminRunnersService','$state', function($scope, service,$state){
    var self = this;
    $scope.info=[];
    self.selectedRunner = {};
    $scope.show = false;
    $scope.selectedRunners =[];
    $scope.isMerge = false;
    $scope.message = '';
    
    $scope.$watch('selectedRunners', function(){
        
        $scope.isMerge = $scope.selectedRunners.length > 2?true:false;
    });
    
    $scope.merge =  function(){
        $scope.message = 'Merging...';
        
        service.mergeDuplicates().update({data:{main:self.selectedRunner, duplicates:$scope.selectedRunners}}, function(response){
            
            if(!response.error){
                console.log($scope.info);
                $scope.info = JSON.parse(response.data);
                console.log($scope.info);
                
            }
            $scope.message = response.error || 'Runners updated';
        });
        
        self.selectedRunner = {};
        $scope.show = false;
        
        for(var i =0; i < $scope.selectedRunners.length; i++){
            $scope.selectedRunners[i].isSelected = false;
        }
        
    };
    
    $scope.update =  function(){
        $scope.message = 'Updating...';
        service.updateRunner().update({data:self.selectedRunner}, function(response){
            $scope.message = response.error || 'Runner updated';
        });
        
        self.selectedRunner = {};
        $scope.show = false;
        
        for(var i =0; i < $scope.selectedRunners.length; i++){
            $scope.selectedRunners[i].isSelected = false;
        }
        
    };
    
   this.selected = function(runner){
     if(!runner.isSelected && runner === self.selectedRunner){
        $scope.show = false; 
        self.selectedRunner = {};
     }
   };
   this.selectedPrimary = function(runner){
       $scope.show = true;
   };
    
    

    service.getRunners().query(
        function(response){
            console.log(response);
            $scope.info = response;
        },
        function(response){
          if(response.status === 401){
            $state.go('app');
          }
          console.log(response.status + '' + response.statusText);
        }
    );
  }])
.controller('LoginDialogController', ['$mdDialog','loginService', function ($mdDialog, loginService){
  var self = this;
  
  self.password = '';
  self.username = 'admin01';
  
  self.close = function() {
     self.wrongPass = false;
      $mdDialog.cancel();
    };
    self.login = function() {
      self.wrongPass = false;
      self.loading = true;
      
      loginService.adminLogin().check({user: self.username, password: self.password}, function(response){
        self.loading = false;
          if(response.error){
            self.wrongPass = true;
            return;
          }
          $mdDialog.hide(response);
        });
    };
}]);

function onSuccess(response, self, scope){
  
  self.info = setTopResults(response);
  scope.isDataLoaded = true;
}

function onError(response, scope){
  scope.isDataLoaded = true;
  scope.isError = true;
  scope.message = response.status + '' + response.statusText;
}

function setTopResults(data){
  for(var i = 0; i < data.results.length; i++){
    
    if(data.results[i].ACT_RESULT === 'C' && i < 6){
      data.results[i].POINTS_RANK = i + 1;
    }
    else{
      break;
    }
  }
  return data;
}

