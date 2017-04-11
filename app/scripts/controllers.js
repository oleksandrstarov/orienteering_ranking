'use strict';

angular.module('app')
.controller('HomeController', ['$scope', 'statsService', '$state', function($scope, statsService, $state) {
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
        if(error.status === 434){
          handleMaintanance($state);
        }
        $scope.message = error.error;
        $scope.isError = true;
        $scope.isDataLoaded = true;
      });
  
}])


.controller('CompetitionsController', ['$scope', 'competitionsService', '$state', function($scope, competitionsService, $state) {
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
        if(response.status === 434){
          handleMaintanance($state);
        }
        $scope.isDataLoaded = true;
        $scope.isError = true;
        $scope.message = response.status + '' + response.statusText;
      });
   
  
}])

.controller('CompetitionViewController', ['$scope', '$stateParams', 'competitionsService', '$state', function($scope, $stateParams, competitionsService, $state) {
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
        if(response.status === 434){
          handleMaintanance($state);
        }
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

.controller('RunnersController', ['$scope', 'runnerService', '$state', function($scope, runnerService, $state) {
    var self = this;
    self.info=[];
    $scope.isDataLoaded = false;
    $scope.isError = false;
    $scope.message = '';
    self.manFilter = '';
    self.womanFilter = '';
    self.manShift = null;
    self.womanShift = null;
    self.manData = [];
    self.womanData = [];
    
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
        var indexManEnds = getFirstElementIndex(response, 'SEX', 'W');
        self.manData = response.slice(0, indexManEnds-1);
        self.womanData = response.slice(indexManEnds);
        
        self.manShift = -self.manData[0].CUR_RANK;
        self.womanShift = -self.womanData[0].CUR_RANK;
      
        self.info = response;
      },
      function(response){
        if(response.status === 434){
          handleMaintanance($state);
        }
        //console.log(response);
        $scope.isDataLoaded = true;
        $scope.isError = true;
        $scope.message = response.status + '' + response.statusText;
      });
    
    function getFirstElementIndex(array, attr, value){
      for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
      }
      return -1;
    }
      
    self.isSubjective = function(subjective){
      if(subjective === 'Y'){
        return 'subjective-points';
      }
      else return '';
    };
    //"Место {{runner.PLACE_DIFF}}n\Очки {{runner.POINTS_DIFF}}"
    self.getPopup = function(runner){
      
      if(runner.PLACE_DIFF=== null){
        return "Новый спортсмен";
      }
      return "Место " + runner.PLACE_DIFF+" \n Очки "+runner.POINTS_DIFF;
    };
    
    
    self.checkPlace = function(runner){
      if(runner.PLACE_DIFF > 0){
        return "glyphicon-circle-arrow-up color-green"
      }
      if(runner.PLACE_DIFF < 0){
        return "glyphicon-circle-arrow-down color-red"
      }
      
      if(runner.PLACE_DIFF === null){
        return "glyphicon glyphicon-plus-sign color-blue"
      }
      return "glyphicon-circle-arrow-right color-grey";
    };
}])

.controller('RunnerViewController', ['$scope', '$stateParams', 'runnerService', '$state', function($scope, $stateParams, runnerService, $state) {
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
        if(response.status === 434){
          handleMaintanance($state);
        }
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

.controller('AboutController', ['aboutService', '$scope', '$state', function(aboutService, $scope, $state) {
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
      if(response.status === 434){
          handleMaintanance($state);
        }
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
.controller('AdminRunnersController',  ['$scope', 'adminRunnersService','$state', function($scope, service, $state){
    var self = this;
    $scope.info=[];
    self.selectedRunner = {};
    $scope.show = false;
    $scope.selectedRunners =[];
    $scope.mergedRunners = [];
    $scope.isMerge = false;
    $scope.message = '';
    
    var processedRunnersIds = [];
    
    $scope.filterInfo = function(runners){
      if(processedRunnersIds.length === 0){
        return runners;
      }
      
      return $scope.info.filter(function (runner) {
        return processedRunnersIds.indexOf(runner.ID) === -1;
      });
    }
    
    
    $scope.$watch('selectedRunners', function(){
        
        $scope.isMerge = $scope.selectedRunners.length > 2?true:false;
    });
    
    $scope.merge =  function(){
      
      $scope.mergedRunners.push({main:self.selectedRunner, duplicates:$scope.selectedRunners});
      
      
      self.selectedRunner = {};
      $scope.show = false;
      
      for(var i =0; i < $scope.selectedRunners.length; i++){
          $scope.selectedRunners[i].isSelected = false;
          processedRunnersIds.push($scope.selectedRunners[i].ID);
      }
      $scope.selectedRunners =[];
    };
    
    $scope.cancel =  function(){
      processedRunnersIds = [];
      $scope.mergedRunners = [];
      $scope.selectedRunners =[];
      self.selectedRunner = {};
      $scope.show = false;
      for(var i =0; i < $scope.selectedRunners.length; i++){
          $scope.selectedRunners[i].isSelected = false;
      }
    };
    
    $scope.updateMergedData =  function(){
      $scope.message = 'Merging...';
      
      service.mergeDuplicates().update($scope.mergedRunners, function(response){
          if(!response.error){
            $scope.info = JSON.parse(response.data);
          }
          $scope.message = response.error || 'Runners updated';
          processedRunnersIds = [];
      });
      
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
        }
    );
  }])
.controller('LoginDialogController', ['$mdDialog','loginService', '$state', function ($mdDialog, loginService, $state){
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
      
      loginService.adminLogin().check({user: self.username, password: self.password}, 
        function(response){
          self.loading = false;
          
            if(response.error){
              self.wrongPass = true;
              return;
            }
            $mdDialog.hide(response);
          }, function(response){
              self.loading = false;
              self.service = true;
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

function handleMaintanance($state){
  $state.go('app.service');
}

