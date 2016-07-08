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