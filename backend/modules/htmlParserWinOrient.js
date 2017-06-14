var request = require('request'),
    cheerio = require('cheerio'),
    iconv  = require('iconv-lite'),
    groupSettings = require('./settings.js').getGroupSettings(),
    Buffer = require('buffer').Buffer;


module.exports.processCompetition = function (competitionData, callback){
    var url = competitionData.URL;
    request({encoding:null, method: "GET", url: url}, function (error, response, body) {
        if (!error) {
            //console.log(url);
            
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
            /*
            
            competitionData.group = [{},{}];
            
            ////console.log($('h2:contains("М21Е"), h2:contains("M21E")').next().text());
            ////console.log($('h2:contains("Ж21Е"), h2:contains("W21E")').next().text());
            
            competitionData.group[0].name = 'M21E';
            competitionData.group[0].data = processResults('h2:contains("М21Е"), h2:contains("M21E")', $);
            competitionData.group[1].name = 'W21E';
            competitionData.group[1].data = processResults('h2:contains("Ж21Е"), h2:contains("W21E")', $);*/
            
            if(isEmpty){
                competitionData.NOTES += ' Нет групп для рассчета';
                competitionData.STATUS = 'INVALID';
                ////console.log(result.title);
                callback(competitionData.ID + ' NO VALID GROUPS', competitionData);
                return; 
            }
            
            //get type, use corret module to parse
            //(ID, DATE, URL, NAME, TYPE, STATUS, VALID, WEB_ID)
            callback(null, competitionData);
           
        } else {
            
            //console.log('error: ' + error);
            callback(error, null);
        }
        
    });
}

function getDataIndexes(headerLine, headers){
    var indexes = [];
    for(var i=0; i<headers.length; i++){
        if(headers[i]!== 'имя'){
            if(headers[i] === 'ГР'){
                indexes.push(headerLine.indexOf(headers[i]) - 1);
            }else{
                indexes.push(headerLine.indexOf(headers[i]));
            }
            
        }
    }
    return indexes;
}


function createEntryPattern(headerLine){
    //№п/п Фамилия, имя              Коллектив            Квал Номер ГР  Результат Место Прим
    var pattern = [];
    
    var headers = headerLine.split(' ');
    
    headers = headers.filter(function(item){
        return item !== '' && item !== 'имя';
    });
    var dataIndexes = getDataIndexes(headerLine, headers);
    for(var header in headers){
        switch(headers[header]) {
            case '№п/п':  
                pattern[header] = 'orderNumber';
            break;
            
            case 'Номер':  
                pattern[header] = 'numberBib';
            break;
            
            case 'Фамилия,':  
                pattern[header] = 'fullName';
            break;
            
            case 'ГР':  
                pattern[header] = 'birthDate';
            break;
            
            case 'Квал':  
                pattern[header] = 'qualification';
            break;
            
            case 'Коллектив':  
                pattern[header] = 'team';
            break;
           
            case 'Результат':
            case 'РезультатОтставан':
                pattern[header] = 'result';
            break;
            
            case 'Место':  
                pattern[header] = 'place';
            break;
            
            case 'Прим':  
                pattern[header] = 'notes';
            break;
        }
        
    }
    if(pattern.length > 0){
        pattern.push(dataIndexes);
    }
    return pattern;
}



function processResultLine(element, pattern){
    var resultLine = {};
    for(var i = 0; i<pattern[pattern.length-1].length-1; i++){
        resultLine[pattern[i]] = element.substring(pattern[pattern.length-1][i], pattern[pattern.length-1][i+1]).trim();
    }
    resultLine = normalizeResultSet(resultLine);
    resultLine.timeBehind = '';
    return resultLine;
}



function processResults(group, $){
    var groupResult = [];
    var pattern = [];
    var dataArray = $(getHeaderSerachPattern(group.variants)).next().text().split('\r\n');
    
    if(dataArray.length === 0){
        return null;
    }
    dataArray.shift();
    dataArray.pop();
    dataArray.forEach(function(element, index){
        
        if(index === 0){
            pattern = createEntryPattern(element);
            
        }else{
            
            var result = processResultLine(element,pattern);
            if(result != null){
                result.sex = group.sex;
                groupResult.push(result);
            }
            
        }
    });
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
    
    if(resultSet.fullName.indexOf('В/К') != -1 || resultSet.fullName.indexOf(' вк')!= -1){
        return null;
    }
    resultSet.fullName = resultSet.fullName.replace(/\(\d+\)?/, '').replace(/\d+\)?/, ' ').replace(/\s+/, ' ').trim();
    resultSet.firstName = resultSet.fullName.split(' ')[1];
    resultSet.lastName = resultSet.fullName.split(' ')[0];
    resultSet.firstName = normalizeFullname(resultSet.firstName);
    resultSet.lastName = normalizeFullname(resultSet.lastName);
    resultSet.team = normalizeClub(resultSet.team);
    resultSet.place = resultSet.place.replace(/\D+/g, '').trim();
    resultSet.place = resultSet.place?resultSet.place:-1;
    resultSet.birthDate = resultSet.birthDate && resultSet.birthDate.trim().length > 3?resultSet.birthDate.trim().split(" ")[0]:'';
    resultSet.result = resultSet.result.indexOf(':') === 2?resultSet.result:'0'+resultSet.result;
    
    resultSet.fullName = resultSet.lastName + ' ' + resultSet.firstName;
    //console.log(resultSet);
    return resultSet;
    
}