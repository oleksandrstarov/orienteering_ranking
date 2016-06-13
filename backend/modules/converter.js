//http://orienteering.kh.ua/Result/

'use strict';

var request = require('request'),
    cheerio = require('cheerio'),
    iconv  = require('iconv-lite'),
    Buffer = require('buffer').Buffer,
    url = 'http://orienteering.kh.ua/Result/';




function grabResults(callback){
    var availableCompetitions = [];
    request(url, function (error, response, body) {
        if (!error) {
            var $ = cheerio.load(body);
            $('div.item>div').find('div[id] a').each(function(index, element){
                var link = $(element).attr('href');
                if(link.indexOf('.htm') != -1){
                    
                    if(link.match(/events\/\d+_/)[0].length > 0){
                        availableCompetitions.push({ url: link,
                                                        id: link.match(/events\/\d+_/)[0].match(/\d+/)[0]
                        });
                    }
                }
            });
        } else {
            console.log('error: ' + error);
        }
        console.log(availableCompetitions.length);
        callback(null, availableCompetitions);
    });
    
};



module.exports.getAvailableResults = function(competitionsInDB, callback){
    grabResults(function(error, data){
        var newResults = filterNewResults(data, competitionsInDB);
        //
        var newCompetitionsData = [];
        var i = 0;
        processCompetition(newResults[i], processCompetitionCallback);
         
        function processCompetitionCallback(error, result){
            if(error){
                console.log(error);
            }else{
                newCompetitionsData.push(result);
            }
            
            if(i++ < (10|| newResults.length)){
                processCompetition(newResults[i], processCompetitionCallback);
            }else{
                callback(null, newCompetitionsData);
            }
        }
        
        //callback(error, data);
    });
};

function filterNewResults(allResults, existingResults){
    return allResults.filter(function(item){
        var result = existingResults.indexOf(item.id) < 0;
        existingResults.push(item.id);
        return result;
    });
};


function getCompetitionData(url, callback){
    processCompetition(url, function(error, data){
        callback(error, data)
    });
};

//ONLY M21/W21
function processCompetition(competitionData, callback){
    var url = competitionData.url;
    request({ encoding: null, method: "GET", url: url}, function (error, response, body) {
        if (!error) {
            //console.log(url);
            
            body = iconv.decode(new Buffer(body), "win1251");
            var result = {};
            var $ = cheerio.load(body);
            if(!isValidSFR($('span.name').text())){
                callback(competitionData.id + ' non-SFR', null);
                return;
            }
            result.title = $('h1').text();
            result.date = toDate($('h1').text().match(/(\d{2}.){2}(\d{4}|\d{2})/)[0]);
            result.url = url;
            result.id = competitionData.id;
            
            //console.log(result);
           
            //console.log($('h2:contains("М21Е")').next().html());
            
            
            result.group = [{},{}];
            
            result.group[0].name = 'M21E';
            result.group[0].data = processResults('М21Е', $);
            result.group[1].name = 'W21E';
            result.group[1].data = processResults('Ж21Е', $);
            //console.log(result);
            callback(null, result);
        } else {
            
            console.log('error: ' + error);
            callback(error, null);
        }
        
    });
}

function isValidSFR(string){
    if(string.indexOf('SFR') != -1){
        return true;
    }
    return false;
}


function createEntryPattern(headers){
    var pattern = [];
    for(var header in headers){
        switch(headers[header]) {
            case '№ п/п ':  
                pattern[header] = 'orderNumber';
            break;
            
            case 'Номер ':  
                pattern[header] = 'numberBib';
            break;
            
            case 'Фамилия ':  
                pattern[header] = 'lastName';
            break;
            
            case 'Имя ':  
                pattern[header] = 'firstName';
            break;
            
            case 'Г.р. ':  
                pattern[header] = 'birthDate';
            break;
            
            case 'Разр. ':  
                pattern[header] = 'qualification';
            break;
            
            case 'Команда ':  
                pattern[header] = 'team';
            break;
           
            case 'Результат ':  
                pattern[header] = 'result';
            break;
            
            case 'Место ':  
                pattern[header] = 'place';
            break;
            
            case 'Дельта ':  
                pattern[header] = 'timeBehind';
            break;
        }
        
    }
    return pattern;
}


function toDate(dateStr) {
    var parts = dateStr.split(".");
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function processResultLine(data, pattern){
    var resultLine = {};
    for(var i in data){
        resultLine[pattern[i]] = data[i].trim();
    }
    return resultLine;
}

function processResults(group, $){
    var groupResult = [];
    var pattern = [];
     $('h2:contains('+group+')').next().find('tr').each(function(index, element){
                if(index === 0){
                    var data = []; 
                    $(element).find('th').each(function(i, el){
                        data.push($(el).text());
                    });
                    pattern = createEntryPattern(data);
                }else{
                    var data = []; 
                    $(element).find('nobr').each(function(i, el){
                        data.push($(el).text());
                    });
                    
                    groupResult.push(processResultLine(data, pattern));
                    
                }
                //console.log($(element).text());
            });
    //console.log(groupResult[2]);
    return groupResult;
}