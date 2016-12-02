var request = require('request'),
    cheerio = require('cheerio'),
    iconv  = require('iconv-lite'),
    Buffer = require('buffer').Buffer,
    SFRparser= require('./htmlParserSFR.js'),
    url = 'http://orienteering.kh.ua/Result/';


module.exports.processCompetition = function(competitionData, callback){
    var url = competitionData.URL;
    request({ encoding: null, method: "GET", url: url}, function (error, response, body) {
        if (!error) {
            ////console.log(url);
            
            body = iconv.decode(new Buffer(body), "win1251");
           
            var $ = cheerio.load(body);
            
            competitionData.group = [{},{}];
            
            competitionData.group[0].name = 'M21E';
            competitionData.group[0].data = processResults('М21Е', $);
            competitionData.group[1].name = 'W21E';
            competitionData.group[1].data = processResults('Ж21Е', $);
            ////console.log(result.group[1].data);
            if(competitionData.group[0].data.length === 0 && competitionData.group[1].data.length === 0){
                competitionData.NOTES += ' Нет групп для рассчета';
                competitionData.STATUS = 'INVALID';
                ////console.log(result.title);
                callback(competitionData.ID + ' NO VALID GROUPS', competitionData);
                return; 
            }
            
            callback(null, competitionData);
        } else {
            
            //console.log('error: ' + error);
            callback(error, null);
        }
        
    });
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
            case 'Отставание ':
                pattern[header] = 'timeBehind';
            break;
        }
        
    }
    return pattern;
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
            ////console.log(data);
            var result = processResultLine(data, pattern);
            
            if(result != null){
                result.sex = sex;
                groupResult.push(result);
            }
        }
       
    });
    ////console.log(groupResult);
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
    ////console.log(resultSet);
    return resultSet;
    
}