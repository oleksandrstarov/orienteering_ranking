'use strict';

var competitionsCollector = require('./dataCollector.js'),
    pointsCalculator = require('./pointsCalculator.js'),
    SFRparser= require('./htmlParserSFR.js'),
    WOparser= require('./htmlParserWinOrient.js'),
    db = require('./dbUtils.js');

var isDataUpdating;
var nextUpdateDate;
var lastUpdateDate;
//updateData();

module.exports.updateData = function (){
   //list[i].DATE.getDay() === 0 ? list[i].DATE : getNextSunday(list[i].DATE)
    
    db.getLastUpdateDate(function(date){
        lastUpdateDate = date;
        nextUpdateDate = new Date().getDay() === 0 ? new Date().withoutTime(): getNextSunday(new Date().withoutTime());
        if(nextUpdateDate === lastUpdateDate){
            nextUpdateDate = lastUpdateDate.addDays(7);
        }
        getNewCompetitionsResults();
    });
};


module.exports.recalculateCompetitions = function (competitionsArray, callback){
   db.updateCompetitionsStatus(competitionsArray, function(error, earliestReadyCompetition){
       
       if(error){
           console.log('error');
           callback(error);
           return;
       }
       console.log('before roll back');
       rollBackDB(earliestReadyCompetition);
   });
};

module.exports.dropData = function (callback){
   db.dropData( function(error){
       if(error){
           callback(error);
       }
       getNewCompetitionsResults();
       //rollBackDB(earliestReadyCompetition, callback);
   });
};


function rollBackDB(date){
    db.rollBackToDate(date, function(error){
        console.log(date);
      getNewCompetitionsResults();
   });
}

module.exports.mergeDuplicates = function (runners, callback){
    var index = 0;
    var idArray = [];
    
    idArray.push(runners[index].main.ID);
            
    runners[index].duplicates.forEach(function(runner){
        idArray.push(runner.ID);
    });
    
    db.setDuplicates(runners[index].main, runners[index].duplicates, setDuplicatesCallback);
    
    function setDuplicatesCallback(error){
        if(error){
            callback('Error setting duplicates: ' + error);
            return;
        }
        
        index++;
        if(index < runners.length){
           // idArray.push(runners[index].main.ID);
            
            runners[index].duplicates.forEach(function(runner){
                idArray.push(runner.ID);
            });
            
            db.setDuplicates(runners[index].main, runners[index].duplicates, setDuplicatesCallback);
        }else{
            db.getEarliestResultDate(idArray, function(error, earliestResultDate){
                rollBackDB(earliestResultDate, callback);
           });
        }
        
        
    }
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
        competitionsCollector.getAvailableResults(processedCompetitions, URLsArray, function(error, list){
           
            if(error){
               console.log(error);
                db.getReadyToImportCompetitions(function(error, competitions){
                    if(competitions.length != 0){
                        importResults(competitions);
                        return;
                    }
                   db.getLastUpdateDate(function(date){
                        if(date.addDays(7) < nextUpdateDate || new Date().getDay() === 0){
                            saveStatistics(date.addDays(7), nextUpdateDate, function(){
                                db.fillCache(function(){
                                    console.log('DONE');
                                  
                                    isDataUpdating = false;
                                    if(callback){
                                        
                                        callback();
                                        return;
                                    }
                                });
                            });
                        }else{
                            db.fillCache(function(){
                                console.log('DONE');
                            
                                isDataUpdating = false;
                                if(callback){
                                    
                                    callback();
                                    return;
                                }
                            });
                        }
                    });
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
                }else{
                    //update statistics
                    db.getLastUpdateDate(function(date){
                        if(date.addDays(7) < nextUpdateDate || new Date().getDay() === 0){
                            saveStatistics(date.addDays(7), nextUpdateDate, function(){
                                db.fillCache(function(){
                                    console.log('DONE');
                                  
                                    isDataUpdating = false;
                                    if(callback){
                                        
                                        callback();
                                        return;
                                    }
                                });
                            });
                        }else{
                            db.fillCache(function(){
                                console.log('DONE');
                            
                                isDataUpdating = false;
                                if(callback){
                                    
                                    callback();
                                    return;
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
    isDataUpdating = true;
    // drop to date before import
    // check best points only for started runners
    var startImport = new Date();
    var i = 0;
    processCompetition(list[i], processCompetitionCallback);
     
    function processCompetitionCallback(error){
        if(error){
            console.error(error);
        }
        
        var nextSunday = list[i].DATE.getDay() === 0 ? list[i].DATE : getNextSunday(list[i].DATE);
        
        
        if(++i <= list.length-1){
            process.stdout.write("\r" +`Importing progress ${Math.round((i+1)/list.length * 100)} %`);
            var nextCompetitionDate = list[i].DATE;
            
            if(nextUpdateDate === nextSunday && new Date().withoutTime() != nextUpdateDate){
                processCompetitionCallback();
            }
            if(nextSunday < nextCompetitionDate){
                saveStatistics(nextSunday, nextCompetitionDate, function(){
                    processCompetition(list[i], processCompetitionCallback);
                });
            }else{
                processCompetition(list[i], processCompetitionCallback);
            }
        }else{
            //exit here
            if(nextSunday < nextUpdateDate){
                saveStatistics(nextSunday, nextUpdateDate, function(){
                    db.fillCache(function(){
                        console.log('DONE');
                        console.log(`Import took ${(new Date() - startImport)/1000}  sec.`);
                        isDataUpdating = false;
                        if(callback){
                            
                            callback(err);
                            return;
                        }
                    });
                    
                    
                })
            }else{
                db.fillCache(function(){
                    console.log('DONE');
                    console.log(`Import took ${(new Date() - startImport)/1000}  sec.`);
                    isDataUpdating = false;
                    if(callback){
                        callback(err);
                        return;
                    }
                });
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

function savePointsStatisticsOnSunday(date, callback){
   db.updateRunnersPoints(date, function(error){
       db.setPointsStatistic(date).then(function(){
          callback(true);
       },
       function(error){
           callback(error);
       });
   }); 
    
};

function getNextSunday(date){
    var day = date.getDay();
    var diff = 7 - day;
    return date.addDays(diff);
}

function saveStatistics(date, nextCompetitionDate, callback){
    savePointsStatisticsOnSunday(date, function(result){
        
        var nextDate = date.addDays(7);
        if(nextCompetitionDate > nextDate){
            saveStatistics(nextDate, nextCompetitionDate, callback);
        }else{
            callback();
        }
        
    });
}

module.exports.isUpdating = function(){
    return isDataUpdating === true;
};