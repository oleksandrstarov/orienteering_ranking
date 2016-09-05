'use strict';

var competitionsCollector = require('./dataCollector.js'),
    pointsCalculator = require('./pointsCalculator.js'),
    SFRparser= require('./htmlParserSFR.js'),
    WOparser= require('./htmlParserWinOrient.js'),
    db = require('./dbUtils.js');


//updateData();

module.exports.updateData = function (){
    /*db.updateRunnersPoints(function(){
        getNewCompetitionsResults();
    });*/
    getNewCompetitionsResults();
};


function getNewCompetitionsResults(){
     var processedCompetitions = [];
     db.getImportedCompetitionsIDs(function(data){
        //console.log(data);
        processedCompetitions = data;
        console.log('after get old ids');
        competitionsCollector.getAvailableResults(processedCompetitions, function(error, list){
            if(error){
                console.log(error);
                 db.getReadyToImportCompetitions(function(competitions){
                    if(competitions.length != 0){
                        importResults(competitions);
                    }
                });
            }else{
                
                console.log('new competitions = ' + list.length);
                if(list.length > 0){
                    db.saveNewCompetitions(list, function(error){
                        if(!error){
                            db.getReadyToImportCompetitions(function(competitions){
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


function importResults(list){
    
    var i = 0;
    
    processCompetition(list[i], processCompetitionCallback);
     
    function processCompetitionCallback(error){
        if(error){
            console.log(error);
           
        }
        return;
        //console.log(list[i].DATE);
        if(++i <= list.length-1){
        // if(--i >= list.length-1){  
            
            processCompetition(list[i], processCompetitionCallback);
        }else{
            //exit here
            console.log('DONE');
        }
    }
}



function processCompetition(competition, callback){
    
    getResults(competition, function(error, competitionData){
        if(error){
            console.log(error);
            callback();
        }
        console.log(competitionData);
        pointsCalculator.processCompetitionResults(competitionData, function(competitionData){
            db.processCompetition(competitionData, function(){
                callback();
            });
        });
    });
    
}

function getResults(competition, callback){
    if(competition.TYPE === 'SFR'){
        SFRparser.processCompetition(competition, function(error, data){
            callback(error, data);
        });
        
    }else if(competition.TYPE === 'WINORIENT'){
        console.log('PASSED');
        WOparser.processCompetition(competition, function(error, data){
            console.log('PASSED');
            callback(error, data);
        });
    }else{
        callback('UNKNOWN TYPE', competition);
    }
    
}