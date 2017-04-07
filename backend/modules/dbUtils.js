'use strict';

var db = require('./dataBase.js'),
    cache = require('./serverCache.js'),
    settings = require('./settings.js').getGroupSettings();

//ready
module.exports.getImportedCompetitionsIDs = function(callback){
   var competitionsIDs = [];
   
   db.getImportedCompetitionsIDs(function(error, data){
       if(!error){
        competitionsIDs = data.map(function(item){
           return item.WEB_ID.toString();
        });
        callback(competitionsIDs);       
        return;
       }
   });
};

module.exports.getBestThreePoints = function(personsArray, callback){
    var persons = '';
    for(var i=0; i< personsArray.length; i++){
        persons += '"' + personsArray[i] + '"';
        if(i != personsArray.length -1){
            persons += ', ';
        }
    }
    //callback(null, [10, 10, 10]);
    //pooints -- array
    db.getBestThreePoints(persons, function(error, points){
        callback(error, points);
    })
    
    
};

module.exports.processCompetition = function(competition, callback){
   //console.log('before db process');
    db.processCompetition(competition, function(error){
        //console.log('competition.STATUS', competition.STATUS);
        if(competition.STATUS === 'INVALID'){
            callback();
            return;
        }
        
        addCompetitionResult(competition, function(error, competition){
            //console.log('error', error);
            db.updateCurrentRanking(competition.DATE, function(){
               
                //console.log('UPDATED AFTER ' + competition.DATE.toMysqlFormat());
                callback();
                return;
            });
        });
        
        
        
    });
    //save competition to db
    //update runners
    
};

module.exports.updateRunnersPoints = function(date, callback){
    db.updateCurrentRanking(date, function(error){
        //console.log(error);
        callback(error);
        
    });
};

module.exports.initDB = function(callback){
  db.prepareDB(function(){
      callback();
  });
};

module.exports.getRunnersList = function(callback){
  db.getRunnersList().then(function(data){
      callback(null, JSON.stringify(data[1]));
  },function(error){
      callback(error, null);
  });
};

module.exports.getCompetitionsList = function(callback){
  db.getCompetitionsList().then(function(data){
      callback(null, JSON.stringify(data[1]));
  },function(error){
      callback(error, null);
  });
};

module.exports.getRunnerResults = function(id, callback){
    db.getRunnerResults(id, function(error, runnerResults){
         db.getRunnerDetails(id, function(error, runnerDetails){
            db.getPointsStatistic(id).then(function(stats){
                var data = {};
                data.details = runnerDetails;
                data.results = runnerResults;
                data.stats = stats;
                callback(error, JSON.stringify(data)); 
            },
            function(error){
                var data = {};
                data.details = runnerDetails;
                data.results = runnerResults;
                callback(error, JSON.stringify(data)); 
            });
           
        });
    });
};

module.exports.getCompetitionResults = function(id, callback){
    db.getCompetitionResults(id, function(error, competitionResults){
        db.getCompetitionDetails(id, function(error, competitionDetails){
            var data = {};
            data.details = competitionDetails;
            data.results = competitionResults;
            //console.log(JSON.stringify(data));
            callback(error, JSON.stringify(data));
        });
    });
};

module.exports.saveNewCompetitions = function(competitions, callback){
    db.saveNewCompetitions(competitions, function(error){
        callback(error);
    });
};

module.exports.getReadyToImportCompetitions = function(callback){
    db.getReadyToImportCompetitions(function(error, competitions){
        callback(error, competitions);
    });
};

module.exports.rollBackToDate = function(date, callback){
    //console.log('rolling back to ' + date);
    db.rollBackToDate(date, function(error){
        console.log(error);
        callback(error);  
    });
};

module.exports.updateCompetitionsStatus = function(competitions, callback){
    db.updateCompetitionsStatus(competitions, function(error, idArray){
        if(error && error!=='noUpdates'){
            callback(error);
            return;
        }
        //console.log(idArray);
        db.getDateToDropFrom(idArray, function(error, earliestDate){
            callback(error, earliestDate);  
        });
    });
};

module.exports.updateCompetition = function(competition, callback){
    db.updateCompetition(competition, function(error){
        callback(error);  
    });
};

module.exports.updateRunnerDetails = function(runner, callback){
    runner.TEAM = runner.TEAM.toUpperCase();
    db.updateRunnerDetails(runner, function(error){
        callback(error);  
    });
};

module.exports.setDuplicates = function(main, duplicates, callback){
    var mainName = main.FULLNAME;
    
    var duplicatesNames = [];
    duplicates.forEach(function(runner){
        duplicatesNames.push(runner.FULLNAME);
    });
    
    db.setDuplicates(mainName, duplicatesNames, function(error){
        callback(error);  
    });
};

//TODO
module.exports.getEarliestResultDate = function(runnersIDs, callback){
    db.getEarliestResultDate(runnersIDs, function(error, date){
        callback(error, date);  
    });
};


function addCompetitionResult(competition, callback){
    //console.log('add competition Result');
    db.setRunnersIDs(competition, function(error, competition){
        //console.log('setRunnersIDs');
        if(!error){
            db.addResults(competition, function(error){
                if(error){
                    console.error(error);
                }
                
                callback(null, competition);
               /* //console.error(error);
                self.addResults();*/
            });
        }else{
            callback(error, competition);
        }
        
    });
    
};

module.exports.getStatistics = function(){
    return db.getStatistic();
};

module.exports.setPointsStatistic = function(date){
    return db.setPointsStatistic(date);
};

module.exports.getGroupSettings = function(){
    return settings.map(function(group){
        return {name: group.name, points: group.shift};
    });
};

module.exports.fillCache = function(callback){
    var runners = db.getRunnersList();
    var competitions = db.getCompetitionsList();
    var statistics = db.getStatistic();
    Promise.all([runners, competitions, statistics]).then(function(data){
        data.forEach(function(value){
            cache.setData(value[0], value[1]);
        });
        callback();
    }).catch(function(error){
        callback(error);
    });
};
var self =this;
setTimeout(function(){self.fillCache(function(){})}, 1000);

module.exports.getDataFromCache = function(prop){
   return cache.getData(prop);
};
