var request = require('request'),
    cheerio = require('cheerio'),
    iconv  = require('iconv-lite'),
    Buffer = require('buffer').Buffer;


module.exports.processCompetition = function (competitionData, callback){
    var url = competitionData.URL;
    request({ encoding: null, method: "GET", url: url}, function (error, response, body) {
        if (!error) {
            console.log(url);
            
            body = iconv.decode(new Buffer(body), "win1251");
            var $ = cheerio.load(body);
            
            competitionData.group = [{},{}];
            
            //console.log($('h2:contains("М21Е"), h2:contains("M21E")').next().text());
            //console.log($('h2:contains("Ж21Е"), h2:contains("W21E")').next().text());
            
            competitionData.group[0].name = 'M21E';
            competitionData.group[0].data = processResults('h2:contains("М21Е"), h2:contains("M21E")', $);
            competitionData.group[1].name = 'W21E';
            competitionData.group[1].data = processResults('h2:contains("Ж21Е"), h2:contains("W21E")', $);
            
            if(competitionData.group[0].data.length === 0 && competitionData.group[1].data.length === 0){
                competitionData.NAME += ' NO VALID GROUPS';
                competitionData.STATUS = 'invalid';
                //console.log(result.title);
                callback(competitionData.ID + ' NO VALID GROUPS', competitionData);
                return; 
            }
            
            //get type, use corret module to parse
            //(ID, DATE, URL, NAME, TYPE, STATUS, VALID, WEB_ID)
            callback(null, competitionData);
           
        } else {
            
            console.log('error: ' + error);
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
        //console.log(pattern[i] + ' - ' +element.substring(pattern[pattern.length-1][i], pattern[pattern.length-1][i+1]).trim());
        resultLine[pattern[i]] = element.substring(pattern[pattern.length-1][i], pattern[pattern.length-1][i+1]).trim();
    }
    resultLine = normalizeResultSet(resultLine);
    resultLine.timeBehind = '';
    return resultLine;
}



function processResults(group, $){
    var groupResult = [];
    var pattern = [];
    var sex = (group.indexOf('М') >= 0)? 'M':'W';
    var dataArray = $(group).next().text().split('\r\n');
    
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
                result.sex = sex;
                groupResult.push(result);
            }
            
        }
    });
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
    
    if(resultSet.fullName.indexOf('В/К') != -1){
        return null;
    }
    resultSet.firstName = resultSet.fullName.split(' ')[1];
    resultSet.lastName = resultSet.fullName.split(' ')[0];
    resultSet.firstName = normalizeFullname(resultSet.firstName);
    resultSet.lastName = normalizeFullname(resultSet.lastName);
    resultSet.team = normalizeClub(resultSet.team);
    
    resultSet.fullName = resultSet.lastName + ' ' + resultSet.firstName;
    //console.log(resultSet);
    return resultSet;
    
}