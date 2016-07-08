'use strict';

var db = require('./dbUtils.js'),
    settings = require('./settings.js').getSettings();

/*{ title: 'Чемпионат Харьковской области. Васищево-север..     Средняя,  21.02.2016.     Протокол результатов.',
  date: Sun Feb 21 2016 00:00:00 GMT+0000 (UTC),
  url: 'http://orienteering.kh.ua/images/events/557_Protokol-rezultatov.CHempionat-Har.obl.Vasishchevo.Srednyaya.htm',
  group: 
   [ { name: 'M21E', data: [Object] },
     { name: 'W21E', data: [Object] } ] }
{ orderNumber: '10',
  numberBib: '367',
  lastName: 'Кизиев',
  firstName: 'Сергей',
  team: 'O-DEAF, КДЮСШ 3',
  result: '00:53:48',
  place: '10',
  timeBehind: '+13:25',
  fullName: 'Кизиев Сергей' }*/



module.exports.processCompetitionResults = function(resultsObject, callback){
    //console.log(resultsObject);
    checkGroups(resultsObject);
    var j = 0
    //console.log(resultsObject.group[j]);
    //resultsObject.group[i].avgPoints = 10;
    getBestThreePoints(resultsObject.group[j], getBestThreePointsCallback);
    
    function getBestThreePointsCallback(error, bestPoints){
        if(error){
            console.log(error);
        }
        //console.log(j);
        resultsObject.group[j].avgPoints = getAvgData(bestPoints);
        
        if(++j < resultsObject.group.length){
            getBestThreePoints(resultsObject.group[j], getBestThreePointsCallback);
        }else{
            
            for(var i=0; i<resultsObject.group.length; i++){
                if(resultsObject.group[i].isValid){
                    resultsObject.group[i] = processGroup(resultsObject.group[i]);
                }else{
                    resultsObject.group[i] =processInvalidGroup(resultsObject.group[i]);
                }
            }
            callback(resultsObject);
        }
    }
};



function processGroup(group){
    group = setResultAndAvgTopTime(group);
    console.log(group.name);
    for(var i=0; i<group.data.length; i++){
        var result = group.data[i].resultSeconds;
        if(result === -1){
            group.data[i].result = '00:00:00';
            group.data[i].place = -1;
            group.data[i].points = null;
        }
        group.data[i].points = countPoints(result, group.avgTime, group.avgPoints);
        /*console.log(group.data[i].lastName + " " +
                    group.data[i].firstName + " " +
                    group.data[i].result + " " +
                    group.data[i].points + " ");*/
    }
    return group;
}


function countPoints(time, avgTime, avgPoints, constant){
    if(constant === undefined){
        constant = settings.defaultPoints;
    }
    if(time === -1){
        return settings.maxPoints;
    }
    
    //Points (P) = (Time - (TM - PM /  KK)) õ KK
		//KK  =  (75 + PM) / TM)
		//limit is 300
		
	var correlationValue = (constant + avgPoints)/avgTime;
	var points = (time - (avgTime - avgPoints/correlationValue))*correlationValue;
	
	return points <= settings.maxPoints? round(points) : settings.maxPoints;
}

function round(points){
    return Math.round(points * 100) / 100;
}


function getAvgData(threeTopData){
    var avgValue =0;
    for(var i=0; i<3; i++){
        avgValue+=threeTopData[i];
    }
    return avgValue/3;
}

//from db
function getBestThreePoints(group, callback){
    if(!group.isValid){
        callback('INVALID GROUP - NO POINTS', [settings.defaultPoints,settings.defaultPoints,settings.defaultPoints]);
        return;
    }
    
    var personsArray = [];
    for(var j=0; j<group.data.length; j++ ){
        //resultsObject.group[i].data[j].currentPoints = 10;
        personsArray.push(group.data[j].fullName);
    }
    
    db.getBestThreePoints(personsArray, function(error, bestPoints){
        if(error){
            callback(error, [settings.defaultPoints,settings.defaultPoints,settings.defaultPoints]);
        }else{
            callback(null, bestPoints);
        }
        
    })
}


function setResultAndAvgTopTime(group){
    var topTime = [];
    if(group.isValid){
        for(var j=0; j<group.data.length; j++ ){
            group.data[j].resultSeconds = convertResultToSeconds(group.data[j].result);
            if(j<3){
                topTime.push(group.data[j].resultSeconds);
            }
        } 
    }
    
    group.avgTime = getAvgData(topTime);
    return group;
}

function convertResultToSeconds(resultString){
    var re = new RegExp(/(\d{2}:){2}(\d{2})/);
    var result = -1;
    if(re.test(resultString)){
        var data = resultString.split(':');
        result = parseInt(data[2]) + parseInt(data[1]) * 60 + parseInt(data[0]) * 60 *60;
    }
    return result;
}

function checkGroups(resultsObject){
    for(var i=0; i<resultsObject.group.length; i++){
        resultsObject.group[i].isValid = true;
        if(resultsObject.group[i].data.length < 3){
            resultsObject.group[i].isValid = false;
            continue;
        }
        
        for(var j=0; j<resultsObject.group[i].data.length; j++){
            if(convertResultToSeconds(resultsObject.group[i].data[j].result) === -1 && j < 3){
                resultsObject.group[i].isValid = false;
                break;
            }
        }
    }
}

function processInvalidGroup(group){
    group = setResultAndAvgTopTime(group);
    for(var i=0; i<group.data.length; i++){
        var result = convertResultToSeconds(group.data[i].result);
        group.data[i].resultSeconds = result;
        if(result === -1){
            group.data[i].result = '00:00:00';
            group.data[i].place = -1;
            
        }
        group.data[i].points = settings.maxPoints;
        /*console.log(group.data[i].lastName + " " +
                    group.data[i].firstName + " " +
                    group.data[i].result + " " +
                    group.data[i].points + " ");*/
    }
    return group;
}

