'use strict';

var converter = require('./converter.js'),
    pointsCalculator = require('./pointsCalculator.js'),
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
        //console.log('after get old ids');
        converter.getAvailableResults(processedCompetitions, function(error, list){
            if(error){
                console.log(error);
            }else{
                console.log('new competitions = ' + list.length);

                var i = list.length-1;
               
                processCompetition(list[i], processCompetitionCallback);
                 
                function processCompetitionCallback(error, result){
                    if(error){
                        console.log(error);
                       
                    }else{
                       
                    }
                    
                    if(--i >= 0){
                    // if(--i >= list.length-1){  
                        processCompetition(list[i], processCompetitionCallback);
                    }else{
                        //exit here
                        console.log('DONE');
                    }
                }
            }
        });
    });
}

function processCompetition(competition, callback){
    //console.log(competition);
    if(competition.isValid){
        pointsCalculator.processCompetitionResults(competition, function(competition){
            db.addCompetition(competition, function(){
                callback();
            });
        });
    }else{
        db.addCompetition(competition, function(){
            callback();
        });
    }
};