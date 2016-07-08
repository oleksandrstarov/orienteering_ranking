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
            
            
           
            var $body = cheerio.load(body);
            //var $ = cheerio.load($body('div').html());
            var filteredResult = '';
            // id 118 == 2015 year///
            $body('table').find('div[id].results-list').each(function(index, element){
                if($body(element).parent().find('div[id]').attr('id') >= 118){
                    filteredResult += $body(element).html();
                }
            });
            
            var $ = cheerio.load('<div>'+filteredResult+'</div>');
            //console.log($());
            //'div.item>div'
            $('div').find('a').each(function(index, element){
                var link = $(element).attr('href');
                //console.log($(element).html());
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
       
        //console.log(availableCompetitions);
        callback(null, availableCompetitions);
    });
    
};



module.exports.getAvailableResults = function(competitionsInDB, callback){
    grabResults(function(error, data){
        //console.log(data.length);
        var newResults = filterNewResults(data, competitionsInDB);
        //console.log(newResults.length);
        //
        if(newResults.length === 0){
            callback('No new Results', []);
            return;
        }
        var newCompetitionsData = [];
        var i = 0;
       // console.log(newResults);
        processCompetition(newResults[i], processCompetitionCallback);
         
        function processCompetitionCallback(error, result){
            if(error){
                //console.log(error);
                newCompetitionsData.push(result);
            }else{
                newCompetitionsData.push(result);
            }
            
            if(++i < newResults.length){
                
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
        //console.log(result);
        existingResults.push(item.id);
        return result;
    });
};


/*function getCompetitionData(url, callback){
    processCompetition(url, function(error, data){
        callback(error, data)
    });
};*/

//ONLY M21/W21
function processCompetition(competitionData, callback){
    var url = competitionData.url;
    request({ encoding: null, method: "GET", url: url}, function (error, response, body) {
        if (!error) {
            //console.log(url);
            
            body = iconv.decode(new Buffer(body), "win1251");
            var result = {};
            result.id = competitionData.id;
            result.url = url;
            var $ = cheerio.load(body);
            
            if(!isValidSFR($('span.name').text())){
                result.title = 'Non-SFR';
                result.date = null;
                result.isValid = false;
                callback(competitionData.id + ' non-SFR', result);
                return;
            }
            result.isValid = true;
            result.title = $('h1').text().normalizeTitle();
            result.date = toDate($('h1').text().match(/(\d{2}.){2}(\d{4}|\d{2})/)[0]).toMysqlFormat();
            //console.log(typeof result.date);
           
            //console.log($('h2:contains("М21Е")').next().html());
            
            
            result.group = [{},{}];
            
            result.group[0].name = 'M21E';
            result.group[0].data = processResults('М21Е', $);
            result.group[1].name = 'W21E';
            result.group[1].data = processResults('Ж21Е', $);
            //console.log(result.group[1].data);
            if(result.group[0].data.length === 0 && result.group[1].data.length === 0){
                result.title += ' NO VALID GROUPS';
                result.isValid = false;
                //console.log(result.title);
                callback(competitionData.id + ' NO VALID GROUPS', result);
                return; 
            }
            
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
    
    //take i from pattern as we dont need splits here....
    for(var i in pattern){
        resultLine[pattern[i]] = data[i].trim();
    }
    
    resultLine = normalizeResultSet(resultLine);
    
    return resultLine;
}



function processResults(group, $){
    var groupResult = [];
    var pattern = [];
    var sex = (group == 'М21Е')? 'M':'W';
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
            var result = processResultLine(data, pattern);
            
            if(result != null){
                result.sex = sex;
                groupResult.push(result);
            }
        }
       
    });
    //console.log(groupResult);
    return groupResult;
}

function normalizeFullname(name){
    name = name.toLowerCase();
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function normalizeClub(club){
    club = club.replace(/\'/g, '').replace(/\"/g, '');
    return club.toUpperCase();
}

function normalizeResultSet(resultSet){
    if(resultSet.firstName.indexOf('В/К') != -1){
        return null;
    }
    
    resultSet.firstName = normalizeFullname(resultSet.firstName);
    resultSet.lastName = normalizeFullname(resultSet.lastName);
    resultSet.team = normalizeClub(resultSet.team);
    
    resultSet.fullName = resultSet.lastName + ' ' + resultSet.firstName;
    //console.log(resultSet);
    return resultSet;
    
}