var request = require('request'),
    cheerio = require('cheerio'),
    iconv  = require('iconv-lite'),
    Buffer = require('buffer').Buffer,
    groupSettings = require('./settings.js').getGroupSettings(),
    url = 'http://orienteering.kh.ua/Result/';


module.exports.processCompetition = function(competitionData, callback){
    var url = competitionData.URL;
    request({ encoding: null, method: "GET", url: url}, function (error, response, body) {
        if (!error) {
            ////console.log(url);
            
            body = iconv.decode(new Buffer(body), "win1251");
           
            var $ = cheerio.load(body);
            
            competitionData.group = JSON.parse(JSON.stringify(groupSettings));
            var isEmpty = true;
            for(var i=0; i<competitionData.group.length; i++){
                competitionData.group[i].data = processResults(competitionData.group[i], $);
                if(competitionData.group[i].data.length === 0){
                    
                   competitionData.group.splice(i,1);
                   i--;
                }else if(isEmpty){
                    isEmpty = false;
                }
            }
            
            if(isEmpty){
                competitionData.NOTES += ' Нет групп для рассчета';
                competitionData.STATUS = 'INVALID';
                ////console.log(result.title);
                callback(competitionData.ID + ' NO VALID GROUPS', competitionData);
                return; 
            }
            //console.log(competitionData);
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
            
            default:
                pattern[header] = 'notes';
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

     $(getHeaderSerachPattern(group.variants)).next().find('tr').each(function(index, element){
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
                result.sex = group.sex;
                groupResult.push(result);
            }
        }
       
    });
    ////console.log(groupResult);
    return groupResult;
}

function getHeaderSerachPattern(variants){
    var searchPattern = ' ';
    variants.forEach(function(variant){
       searchPattern += 'h2:contains("'+variant+'"),';
    });
    return searchPattern.substring(0, searchPattern.lastIndexOf(','));
}

function normalizeFullname(name){
    if(!name){
        return;
    }
    name = name.toLowerCase().replace(/\(\d+\)?/, '').trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function normalizeClub(club){
    club = club.replace(/\'/g, '').replace(/\"/g, '');
    return club.toUpperCase();
}

function normalizeResultSet(resultSet){
    if(resultSet.firstName.indexOf('В/К') != -1 
    || resultSet.firstName.indexOf(' вк')!= -1
    || (resultSet.notes && resultSet.notes.indexOf('в/к')!= -1)){
        return null;
    }
    
    resultSet.firstName = normalizeFullname(resultSet.firstName);
    resultSet.lastName = normalizeFullname(resultSet.lastName.split(' ')[0]);
    resultSet.team = normalizeClub(resultSet.team);
    resultSet.place = resultSet.place.replace(/\D+/g, '').trim();
    resultSet.place = resultSet.place?resultSet.place:-1;
    resultSet.birthDate = resultSet.birthDate && resultSet.birthDate.trim().length > 3?resultSet.birthDate.trim().split(" ")[0]:null;
    
    resultSet.fullName = resultSet.lastName + ' ' + resultSet.firstName;
    ////console.log(resultSet);
    return resultSet;
    
}