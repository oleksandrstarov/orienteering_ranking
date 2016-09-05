'use strict';

var db = require('./dataBase.js'),
    settings = require('./settings.js').getSettings();

//ready
module.exports.getImportedCompetitionsIDs = function(callback){
   var competitionsIDs = [];
   
   db.getImportedCompetitionsIDs(function(error, data){
       if(!error){
           
        
                competitionsIDs = data.map(function(item){
                   return item.WEB_ID.toString();
               });
           callback(competitionsIDs);       
           
           
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
   
    db.processCompetition(competition, function(error){
        
        addCompetitionResult(competition, function(competition){
            
            db.updateCurrentRanking(competition.DATE, function(){
               
                console.log('UPDATED AFTER ' + competition.DATE);
                callback();  
            });
        });
        
        
        
    });
    //save competition to db
    //update runners
    
};

module.exports.updateRunnersPoints = function(callback){
    db.updateCurrentRanking(null, function(error){
        if(error){
            callback(error);
        }
        else{
            callback();
        }
    });
};

module.exports.initDB = function(callback){
  db.prepareDB(function(){
      callback();
  });
};

module.exports.getRunnersList = function(callback){
  db.getRunnersList(function(error, runners){
      callback(error, JSON.stringify(runners));
  });
};

module.exports.getCompetitionsList = function(callback){
  db.getCompetitionsList(function(error, competitions){
      callback(error, JSON.stringify(competitions));
  });
};

module.exports.getRunnerResults = function(id, callback){
    db.getRunnerResults(id, function(error, runnerResults){
         db.getRunnerDetails(id, function(error, runnerDetails){
            var data = {};
            data.details = runnerDetails;
            data.results = runnerResults;
            callback(error, JSON.stringify(data));
        });
    });
};

module.exports.getCompetitionResults = function(id, callback){
    db.getCompetitionResults(id, function(error, competitionResults){
        db.getCompetitionDetails(id, function(error, competitionDetails){
            var data = {};
            data.details = competitionDetails;
            data.results = competitionResults;
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
        callback(competitions);
    });
};


function addCompetitionResult(competition, callback){
    //var self = this;
    //console.log("competition processsing");
    //console.log(competition);
    db.setRunnersIDs(competition, function(error, competition){
        if(!error){
            
            db.addResults(competition, function(error){
                
                if(error){
                    console.log(error);
                }
                
                callback(competition);
               /* console.log(error);
                self.addResults();*/
            });
        }else{
            callback(error);
        }
        
    });
    
};