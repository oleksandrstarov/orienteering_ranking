'use strict';

var converter = require('./converter.js'),
    pointsCalculator = require('./pointsCalculator.js');


//updateData();

module.exports.updateData = function (){
   getNewCompetitionsResults();
}



//TODO === this should check available competitions in DB ad return array of indexes;
function getProcessedCompetitions(){
    return ['568', '564', '557'];
}

function getNewCompetitionsResults(){
     var processedCompetitions = getProcessedCompetitions();
        
    converter.getAvailableResults(processedCompetitions,function(error, list){
        if(error !== null){
             console.log(error);
        }
        console.log('new competitions = ' + list.length);
        //console.log(list);
        for(var i=0; i<list.length; i++){
            list[i] = pointsCalculator.processCompetitionResults(list[i]);
        }
    });
}