'use strict';


/*{ title: 'Чемпионат Харьковской области. Васищево-север..     Средняя,  21.02.2016.     Протокол результатов.',
  date: Sun Feb 21 2016 00:00:00 GMT+0000 (UTC),
  url: 'http://orienteering.kh.ua/images/events/557_Protokol-rezultatov.CHempionat-Har.obl.Vasishchevo.Srednyaya.htm',
  group: 
   [ { name: 'M21E', data: [Object] },
     { name: 'W21E', data: [Object] } ] }
{ orderNumber: '2',
  numberBib: '555',
  lastName: 'Сухаревская',
  firstName: 'Алёна',
  birthDate: '1992',
  qualification: 'мс',
  team: 'КСО Компас',
  result: '01:02:32',
  place: '2',
  timeBehind: '+6:23' }*/

//var topPoints = [];
var topTime = [];


module.exports.processCompetitionResults = function(resultsObject){
    //console.log(resultsObject);
    checkGroups(resultsObject);
    
    for(var i=0; i<resultsObject.group.length; i++){
        if(resultsObject.group[i].isValid){
           resultsObject.group[i] = processGroup(resultsObject.group[i]);
        }
    }
    return resultsObject;
}


function processGroup(group){
    group = setResult(group);
    var avgPoints = getAvgData(getBestThreePoints(group));
    var avgTime = getAvgData(topTime);
    console.log(group.name);
    for(var i=0; i<group.data.length; i++){
        var result = group.data[i].resultSeconds;
        group.data[i].points = countPoints(result, avgTime, avgPoints);
        console.log(group.data[i].lastName + " " +
                    group.data[i].firstName + " " +
                    group.data[i].result + " " +
                    group.data[i].points + " ");
    }
    return group;
}


function countPoints(time, avgTime, avgPoints, constant){
    if(constant === undefined){
        constant = 75;
    }
    if(time === -1){
        return 300;
    }
    
    //Points (P) = (Time - (TM - PM /  KK)) õ KK
		//KK  =  (75 + PM) / TM)
		//limit is 300
		
	var correlationValue = (constant + avgPoints)/avgTime;
	var points = (time - (avgTime - avgPoints/correlationValue))*correlationValue;
	
	return points <= 300? round(points) : 300;
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
function getBestThreePoints(group){
    var bestPoints = [];
    var personsArray = [];
    for(var j=0; j<group.data.length; j++ ){
        //resultsObject.group[i].data[j].currentPoints = 10;
        personsArray.push(group.data[j].lastName + ' ' + group.data[j].firstName);
    }
    
    //getPointsFromDB(personsArray);
   
    bestPoints = [10, 10, 10];
    return bestPoints;
}


function setResult(group){
    topTime = [];
    for(var j=0; j<group.data.length; j++ ){
        group.data[j].resultSeconds = convertResultToSeconds(group.data[j].result);
        if(j<3){
            topTime.push(group.data[j].resultSeconds);
        }
    }
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
            if(convertResultToSeconds(resultsObject.group[i].data[j].result) === -1 && j <= 3){
                resultsObject.group[i].isValid = false;
                break;
            }
        }
    }
}

