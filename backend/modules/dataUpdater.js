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
var self = this;

module.exports.updateData = function (callback){
    db.getLastUpdateDate(function(date){
        lastUpdateDate = date.withoutTime();
        nextUpdateDate =  getPrevSunday(new Date().UTC().withoutTime());//new Date().UTC().withoutTime().addDays(-(new Date().UTC().getDay()));//getPrevSunday(new Date().UTC().withoutTime());
        console.log('last ', lastUpdateDate, ' next ', nextUpdateDate);
        console.log(new Date().UTC());
        console.log(new Date().UTC().withoutTime());
        console.log(new Date().UTC().withoutTime().getDay());
        console.log(new Date().UTC().withoutTime().addDays(-(new Date().UTC().withoutTime().getDay())));
        console.log(new Date().UTC().addDays(-(new Date().UTC().getDay())).withoutTime());
        processUpdate(callback);
    });
};



function processUpdate(callback){
    isDataUpdating = true;
    var startImport = new Date();
     updateCompetitions()
        .then(function(){
            console.log('import');
            return importResults();
        })
        .then(function(){
            
            isDataUpdating = false;
            console.log('DONE');
            console.log(`Import took ${(new Date() - startImport)/1000}  sec.`);
            db.fillCache(function(){
                if(callback){
                    callback();
                }
            });
        })
        .catch(function(error){
            console.log(`Fails after ${(new Date() - startImport)/1000}  sec.`);
            isDataUpdating = false;
            console.log('error on update competitions', error);
            db.fillCache(function(){
                if(callback){
                    callback(error);
                }
            });
        });
}




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
       self.updateData(callback);
       //processUpdate(callback);
       //rollBackDB(earliestReadyCompetition, callback);
   });
};


function rollBackDB(date){
    db.rollBackToDate(date, function(error){
       self.updateData();
       //processUpdate();
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
    var isValidURL = /http:\/\/(.+)\.(.+)\/(.+)\.(htm|html)/.test(data);
    if(isValidURL){
        competitionsCollector.getNewCompetitions(data, function(error, list){
            if(error){
               console.log(error);
            }
            db.saveNewCompetitions(list.reverse(), function(error){
                if(error){
                    console.log(error);
                }
                callback();
            });
        });
    }else{
        callback('Invalid URL provided. Please check');
    }
};

function updateCompetitions(){
    return new Promise(function(resolve, reject){
        var processedCompetitions = [];
         db.getImportedCompetitionsIDs(function(data){
            ////console.log(data);
            processedCompetitions = data;
            competitionsCollector.getNewCompetitions(processedCompetitions, function(error, list){
                if(error){
                   console.log(error);
                    resolve();
                }else{
                    if(list.length > 0){
                        db.saveNewCompetitions(list.reverse(), function(error){
                            if(error){
                                console.log(error);
                            }
                             resolve();
                        });
                    }
                }
            });
        });
    });
}

function importResults(){
    return new Promise(function(resolve, reject){
        if(lastUpdateDate.addDays(7) <= nextUpdateDate){
            importResultsForWeek(lastUpdateDate.addDays(7), function(){
                resolve();
            });
        }else{
            reject('not a sunday today');
        }
    });
}

function importResultsForWeek(date, callback){
    var isNextWeekValid = date.addDays(7) <= nextUpdateDate;
    weeklyImport(date).then(function(){
        if(isNextWeekValid){
            process.stdout.write("\r" +`Working on ${date.addDays(7).toMysqlFormat()}`);
            importResultsForWeek(date.addDays(7), callback);
        }else{
           callback();
        }
    });
}

function weeklyImport(date){
    return new Promise(function(resolve, reject){
        db.getCompetitionsToImport(date)
        .then(function(competitions){
            return processCompetitionsResults(competitions);
        })
        .then(function(){
            return savePointsStatisticsOnSunday(date);
        })
        .then(function(){
            resolve();
        })
        .catch(function(error){
            console.log(error);
            reject('dataUpdater.js ' + error);
        });
    });
}

function processCompetitionsResults(competitions){
    return new Promise(function(resolve, reject){
        if(competitions == null || competitions.length == 0){
            resolve();
        }
        var competition = competitions.shift();
        processCompetitionResult(competition, processCompetitionCallback);
        
        
        function processCompetitionCallback(error){
            if(error){
                reject('rejected with error '+ error);
            }
            if(competitions.length > 0){
                competition = competitions.shift();
                processCompetitionResult(competition, processCompetitionCallback);
            }else{
                resolve();
            }
        }
    });
}

function processCompetitionResult(competition, callback){
    getResults(competition, function(error, competitionData){
        if(error){
            console.log(error);
            db.processCompetition(competitionData, function(){
                callback();
                return;
            });
        }else{
            db.updateRunnersPoints(competitionData.DATE, function(error){
                pointsCalculator.processCompetitionResults(competitionData, function(competitionData){
                    db.processCompetition(competitionData, function(){
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
        competition.STATUS = 'INVALID';
        callback('UNKNOWN TYPE', competition);
    }
    
}

function savePointsStatisticsOnSunday(date){
    return new Promise(function(resolve, reject){
        db.updateRunnersPoints(date, function(error){
           db.setPointsStatistic(date)
               .then(function(){
                  resolve();
               },
               function(error){
                   reject(error);
               });
       }); 
    });
};

function getPrevSunday(date){
    console.log(date);
    var day = date.getDay();
    console.log(-day);
    date = date.addDays(-day);
    console.log(date);
    return date;
}

module.exports.isUpdating = function(){
    return isDataUpdating === true;
};
