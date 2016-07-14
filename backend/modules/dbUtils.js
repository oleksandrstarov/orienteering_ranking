'use strict';

var db = require('./dataBase.js'),
    settings = require('./settings.js').getSettings();

//ready
module.exports.getImportedCompetitionsIDs = function(callback){
   var competitionsIDs = [];
   
   db.getImportedCompetitionsIDs(function(error, data){
       if(!error){
           
           competitionsIDs = data.map(function(item){
               return item.ID.toString();
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


module.exports.addCompetition = function(competition, callback){
    var self = this;
    db.addCompetition(competition, function(error){
        console.log(error);
        if(competition.isValid){
            addCompetitionResult(competition, function(){
                db.updateCurrentRanking(competition.date, function(){
                    console.log('UPDATED AFTER ' + competition.date);
                    callback();  
                });
            });
        
        }else{
            callback();
        }
        //self.updateRunnersPoints();
        
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
         db.getCompetitionDetails(id, function(error, runnerDetails){
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





function addCompetitionResult(competition, callback){
    //var self = this;
    //console.log(competition);
    db.setRunnersIDs(competition, function(error, competition){
        if(!error){
            console.log(competition.id);
            db.addResults(competition, function(error){
                console.log(competition.id);
                if(error){
                    console.log(error);
                }
                
                callback();
               /* console.log(error);
                self.addResults();*/
            });
        }else{
            callback(error);
        }
        
    });
    
};