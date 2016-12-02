'use strict';

var competitionsCollector = require('./dataCollector.js'),
    pointsCalculator = require('./pointsCalculator.js'),
    SFRparser= require('./htmlParserSFR.js'),
    WOparser= require('./htmlParserWinOrient.js'),
    db = require('./dbUtils.js');


//updateData();

module.exports.updateData = function (){
    /*db.updateRunnersPoints(null, function(){
        getNewCompetitionsResults();
    });*/
    getNewCompetitionsResults();
};


module.exports.recalculateCompetitions = function (competitionsArray, callback){
   db.updateCompetitionsStatus(competitionsArray, function(error, earliestReadyCompetition){
       if(error){
           callback(error);
           return;
       }
       rollBackDB(earliestReadyCompetition, callback);
   });
};


function rollBackDB(date, callback){
    db.rollBackToDate(date, function(error){
       db.getReadyToImportCompetitions(function(error, competitions){
            if(competitions.length != 0){
                importResults(competitions, function(){
                    db.updateRunnersPoints(null, function(error){
                        callback(error);
                    });
                });
            }else{
                db.updateRunnersPoints(null, function(error){
                    callback(error, 'Updated');
                });
            }
            
        });
   });
}

module.exports.mergeDuplicates = function (main, duplicates, callback){
    //*TODO 
    db.setDuplicates(main, duplicates, function(error){
        if(error){
            callback('Error setting duplicates: ' + error);
            return;
        }
        var idArray = [main.ID];
        duplicates.forEach(function(runner){
            idArray.push(runner.ID);
        });
        //*TODO 
        db.getEarliestResultDate(idArray, function(error, earliestResultDate){
            rollBackDB(earliestResultDate, callback);
       });
    });
};

module.exports.manualImport = function (data, callback){
    /*db.updateRunnersPoints(null, function(){
        getNewCompetitionsResults();
    });*/
    
    if(/http:\/\/(.+)\.(.+)\/(.+)\.(htm|html)/.test(data)){
        getNewCompetitionsResults(data, callback);
    }else{
        callback('Invalid URL provided. Please check');
    }
};


function getNewCompetitionsResults(URLsArray, callback){
     var processedCompetitions = [];
     db.getImportedCompetitionsIDs(function(data){
        ////console.log(data);
        processedCompetitions = data;
        //console.log('after get old ids');
        competitionsCollector.getAvailableResults(processedCompetitions, URLsArray, function(error, list){
            
            if(error){
               
                 db.getReadyToImportCompetitions(function(error, competitions){
                    
                    if(competitions.length != 0){
                        importResults(competitions);
                    }
                });
            }else{
                //console.log('new competitions = ' , list[0]);
                if(list.length > 0){
                    db.saveNewCompetitions(list.reverse(), function(error){
                        if(URLsArray){
                            callback();
                            return;
                        }
                        if(!error){
                            db.getReadyToImportCompetitions(function(error, competitions){
                                //console.log(competitions);
                                if(competitions.length != 0){
                                    importResults(competitions);
                                }
                            });
                        }
                    });
                }
                
                //save competitions
                //and get new sorted list
            }
        });
    });
}


function importResults(list, callback, err){
    // drop to date before import
    // check best points only for started runners
    var i = 0;
    
    processCompetition(list[i], processCompetitionCallback);
     
    function processCompetitionCallback(error){
        if(error){
            //console.error(error);
           
        }
        
        ////console.log(list[i].DATE);
        if(++i <= list.length-1){
        // if(--i >= list.length-1){  
            
            processCompetition(list[i], processCompetitionCallback);
        }else{
            //exit here
            console.log('DONE');
            if(callback){
                callback(err);
                return;
            }
        }
    }
}



function processCompetition(competition, callback){
    
    getResults(competition, function(error, competitionData){
        if(error){
            
            db.processCompetition(competitionData, function(){
                
                callback();
                return;
            });
        }else{
            //console.log('COMPETITION ' + competitionData.DATE.toMysqlFormat());
        
            db.updateRunnersPoints(competitionData.DATE, function(error){
                //console.log('after update');
                pointsCalculator.processCompetitionResults(competitionData, function(competitionData){
                //console.log('before process');
                    db.processCompetition(competitionData, function(){
                        //console.log('after process');
                        callback();
                        return;
                    });
                });
            });    
        }
        
    });
}

function getResults(competition, callback){
    if(competition.TYPE === 'SFR'){
        SFRparser.processCompetition(competition, function(error, data){
            callback(error, data);
        });
        
    }else if(competition.TYPE === 'WINORIENT'){
        
        WOparser.processCompetition(competition, function(error, data){
            
            callback(error, data);
        });
    }else{
        callback('UNKNOWN TYPE', competition);
    }
    
}