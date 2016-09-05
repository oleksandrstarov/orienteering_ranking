'use strict';

var sql = require('mysql'),
    settings = require('./settings.js').getSQLSettings(),
    defaultSettings = require('./settings.js').getSettings();

var connection = sql.createConnection(settings);

//console.log(settings);
/*connection.connect();

connection.query('SELECT * from TEST', function(err, rows, fields) {
  if (!err)
    console.log(rows[0].data + ' ' + rows[0].value);
  else
    console.log('Error while performing Query.');
});

connection.end();*/

//todo drop to date

module.exports.processCompetition = function(competition, callback){
  var query = 'UPDATE COMPETITIONS SET STATUS = '+ "'imported'" + ', NAME ='+ "'" +competition.NAME+ "'"+' WHERE ID = ' + competition.ID + ';';
  
 
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      console.log('COMPETITION UPDATED');
      callback();
    }
    else{
      console.log('COMPETITION FAILED ' + query);
      console.log(err);
      callback(err);
    }
  });
};


module.exports.saveNewCompetitions = function(competitions, callback){
  var query = 'INSERT INTO COMPETITIONS (DATE, URL, NAME, TYPE, STATUS, WEB_ID) '
  + 'VALUES';
  
  for(var i = 0; i < competitions.length; i++){
    query += '(' 
    + "'" + competitions[i].date   +"'"+ ', '
    + "'" + competitions[i].url   +"'"+ ', ' 
    + "'" + competitions[i].title+ "'" + ', '
    +"'" + competitions[i].type +"'"+ ', ' //SFR, WINORIENT, unknown
    +"'" +(competitions[i].isValid ? "valid": "invalid") +"'"+ ', '  //ready, valid, invalid
    + competitions[i].id //web id for competitions from federation web page
    + ')';
    
     if(i!= competitions.length -1){
        query += ', ';
      }else{
        query += ';';
      }
  }
  
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      console.log('COMPETITIONS ADDED');
      callback();
    }
    else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getReadyToImportCompetitions = function(callback){
  var query = 'SELECT ID, DATE, URL, NAME, TYPE, STATUS FROM COMPETITIONS WHERE STATUS = "valid" '
    + ' ORDER BY DATE;';
  
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      console.log('COMPETITIONS ADDED');
      callback(null, rows);
    }
    else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.addResults = function(competition, callback){
  /*ID MEDIUMINT NOT NULL AUTO_INCREMENT,' 
      +'COMPETITION INT NOT NULL, '
      +'RUNNER INT NOT NULL, '
      +'DATE DATETIME, '
      +'TIME DATETIME, '
      +'PLACE SMALLINT, '
      +'POINTS DECIMAL(5,2), '
      +'COMP_GROUP nvarchar(10), '
      +'DISTANCE nvarchar(1), ' //L,M,S,N...
      +'TIME_BEHIND nvarchar(15)*/
  //console.log(competition);
  if(competition.STATUS !== 'valid'){
    callback('INVALID STATUS');
    return;
  }
  
  var query = 'INSERT INTO RESULTS '
  +'(COMPETITION, RUNNER, DATE, TIME, PLACE, POINTS, COMP_GROUP, DISTANCE, TIME_BEHIND) '
  + 'VALUES ';
  
  for(var i=0; i<competition.group.length; i++){
    var group = competition.group[i];
    for(var j=0; j<group.data.length; j++){
      //console.log(group.data[j].id);
      query += '(' 
      + competition.ID + ', ' 
      + group.data[j].id + ', ' 
      + "'" + competition.DATE.toMysqlFormat()   +"'"+ ', ' 
      + "'" + '1970-01-01 '+ group.data[j].result + "'" + ', '
      +  group.data[j].place + ', '
      +  group.data[j].points + ', '
      +  "'" + group.name + "'" + ', '
      + "'" +  'L' + "'" + ', '
      +  "'" + group.data[j].timeBehind + "'"
      + '), ';
      
      /*if(j!= group.data.length -1 && i != competition.group.length -1){
        query += ', ';
      }else{
        query += ';';
      }*/
    }
  }
  query = query.replace(/\,.$/, ';');
  //console.log(query);
  
  connection.query(query, function(err, rows, fields) {
    if (!err){
      console.log('RESULTS ADDED');
      callback();
    }
    else{
      /*console.log(competition.group[0].data);
      console.log(competition.group[1].data);*/
      console.log(query);
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getImportedCompetitionsIDs = function(callback){
  var query = 'SELECT WEB_ID FROM COMPETITIONS WHERE WEB_ID IS NOT NULL;';
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      
      callback(null, rows);
      
    }
    else{
      console.log(err);
      callback(err, null);
    }
    
  });
};

module.exports.getPersonID = function(runner, callback){
  if(!runner){
    callback('NO VALID RUNNER DATA');
    return;
  }
  var query = 'SELECT ID FROM RUNNERS INNER JOIN DUPLICATES ON FULLNAME = MAIN WHERE VARIANT = '+ '"' + runner.fullName+'"'+ ' LIMIT 1;'
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    //console.log(rows);
    if (!err){
      //console.log('RUNNER ' + runner.fullName+' ID IS ' + rows);
      var id = null;
      //console.log(rows);
      if(rows.length === 0){
        //console.log('New Created');
        addNewRunner(runner, function(error, runnerID){
          if(!error){
            //console.log(runnerID);
            id = runnerID;
            callback(null, id);
          }else{
            callback(error);
          }
          
        });
      }else{
        //console.log('Old Used');
        id = rows[0].ID;
        callback(null, id);
      }
      
    }
    else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.setRunnersIDs = function(competition, callback){
  
  var i = 0;
  var j = 0;
  if(competition.group[i].data[j]){
    competition.group[i].data[j].date = competition.DATE;
  }
  
  //console.log(competition.group.length);
  this.getPersonID(competition.group[i].data[j], getPersonIDcallback);
  var self = this;
  function getPersonIDcallback(error, id){
    /*console.log(i + " " + j);
    console.log(id);
    console.log(competition.group[i].data[j].date);
    console.log(competition.group[i].data[j].fullName);
    */
    
    //console.log('SETTING RUNNER ID ' + id);
    if(error){
      console.log(error);
    }
    
    if(id){
      //console.log(competition.group[i].data[j]);
      competition.group[i].data[j].id = id;
    }
    
    if(++j === competition.group[i].data.length){
      j = 0;
      i++;
    }
    //console.log(competition.group[i].data.length);
    //console.log(i + " " + j);
    if(i < competition.group.length && j < competition.group[i].data.length){
      //console.log(i + " " + j + " New entry");
      if(competition.group[i].data[j]){
        competition.group[i].data[j].date = competition.DATE;
      }
      
      self.getPersonID(competition.group[i].data[j], getPersonIDcallback);
    }else{
      callback(null, competition);
    }
  }

};

module.exports.getBestThreePoints = function(persons, callback){
  var query = 'SELECT CUR_RANK FROM RUNNERS INNER JOIN DUPLICATES ON MAIN = FULLNAME WHERE VARIANT IN ('+ persons + ') ORDER BY CUR_RANK LIMIT 3;'
  
  connection.query(query, function(err, rows, fields) {
   
    if (!err){
     console.log('BEST POINTS SELECTED');
     var points = new Array(3);
     points = rows.map(function(element){
       return element.CUR_RANK;
     });
     
     console.log(points);
     for(var i = 0; i < 3; i++){
      if(!points[i]){
        points[i] = defaultSettings.defaultPoints;
      }
     }
     callback(null, points);
      
    }else{
      console.log(err);
      callback(err, [defaultSettings.defaultPoints, defaultSettings.defaultPoints, defaultSettings.defaultPoints]);
    }
  });
};

module.exports.updateCurrentRanking = function(date, callback){
  console.log(date);
  
  if(!date){
    var dateParam = 'NOW()';
  }else{
    date =new Date(date);
    var dateParam = '"' + date.toMysqlFormat() + '"';
  }
  
  var query = 'UPDATE RUNNERS SET CUR_RANK = NULL;';
    // var query = 'SELECT 1;';
                
    //console.log(query);
    connection.query(query, function(err, rows, fields) {
      //console.log('selected');
      if (!err){
        //console.log('DB UPDATE - DROPPED MAX POINTS');
        //callback();
      }else{
        console.log(err);
        //callback(err);
      }
      
      //console.log(dateParam);
      var query = 'UPDATE RUNNERS,(SELECT RUNNER_ID, NAME, CASE WHEN COUNT(PTS) < 6 THEN ((6 - COUNT(PTS)) * 300  + SUM(PTS))/6 ELSE AVG(PTS) END AS CUR_POINTS '
                + 'FROM ' 
                + '(SELECT RUNNERS.ID RUNNER_ID, FULLNAME NAME, CUR_RANK CUR_POINTS, POINTS PTS, RESULTS.ID AS RESULT_ID '
                + 'FROM RUNNERS '
                + 'INNER JOIN RESULTS ON RESULTS.RUNNER = RUNNERS.ID '
                + 'WHERE DATE > DATE_SUB('+dateParam+', INTERVAL 1 YEAR) '
                + 'ORDER BY RUNNERS.ID, POINTS) AS OUTER_PROP '
                + 'WHERE ( '
                + 'SELECT COUNT(*) FROM (SELECT RUNNERS.ID RUNNER_ID, FULLNAME NAME, CUR_RANK CUR_POINTS, POINTS PTS , RESULTS.ID AS RESULT_ID '
                + 'FROM RUNNERS '
                + 'INNER JOIN RESULTS ON RESULTS.RUNNER = RUNNERS.ID '
                + 'WHERE DATE > DATE_SUB('+dateParam+', INTERVAL 1 YEAR) '
                + 'ORDER BY RUNNERS.ID, POINTS) AS INNER_PROP '
                + 'WHERE INNER_PROP.RUNNER_ID = OUTER_PROP.RUNNER_ID AND '
                + '(CASE WHEN INNER_PROP.PTS <> OUTER_PROP.PTS THEN INNER_PROP.PTS < OUTER_PROP.PTS ELSE INNER_PROP.RESULT_ID < OUTER_PROP.RESULT_ID END) '
                + ') < 6 '
                + 'GROUP BY RUNNER_ID ORDER BY RUNNER_ID) AS TEMP_PROP '
                + 'SET RUNNERS.CUR_RANK = TEMP_PROP.CUR_POINTS '
                + 'WHERE RUNNERS.ID = TEMP_PROP.RUNNER_ID;';
               
      //console.log(query);
      connection.query(query, function(err, rows, fields) {
        //console.log('selected');
        if (!err){
          //console.log('DB UPDATE COMPLETE');
          //callback();
        }else{
          console.log(err);
          //callback(err);
        }
        
        var query = 'UPDATE RUNNERS SET CUR_RANK = 300 WHERE CUR_RANK IS NULL;';
        // var query = 'SELECT 1;';
                    
        //console.log(query);
        connection.query(query, function(err, rows, fields) {
          //console.log('selected');
          if (!err){
            //console.log('DB UPDATE WITH MAX POINTS COMPLETE');
            callback();
          }else{
            console.log(err);
            callback(err);
          }
            
        });
      });
      
      
      
        
    });
};

module.exports.getRunnersList = function(callback){
  var query = 'SELECT ID, FULLNAME, TEAM, SEX, CUR_RANK FROM RUNNERS ORDER BY CUR_RANK;'
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getCompetitionsList = function(callback){
  var query = 'SELECT C.ID AS ID, NAME, C.DATE AS DATE, COUNT(RUNNER) AS RUNNERS, C.STATUS AS STATUS, C.URL AS URL '
  +'FROM COMPETITIONS C '
  +'LEFT JOIN RESULTS ON RESULTS.COMPETITION = C.ID '
  +'GROUP BY C.ID ;';
  
  //SELECT  NAME, COUNT(RESULTS.ID) AS RUNNERS  FROM COMPETITIONS INNER JOIN RESULTS ON RESULTS.COMPETITION = COMPETITIONS.ID WHERE STATUS = 'SFR' GROUP BY COMPETITIONS.ID;
  
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      console.log(rows);
      callback(null, rows);
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getRunnerResults = function(runnerID, callback){
  var query = 'SELECT R.ID AS ID, COMPETITION, NAME, RUNNER, R.DATE AS DATE, TIME, PLACE, POINTS, COMP_GROUP, DISTANCE, TIME_BEHIND, '
  +' CASE WHEN R.DATE > DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN "C" END AS ACT_RESULT'
  +' FROM RESULTS R'
  +' LEFT JOIN COMPETITIONS C ON C.ID = COMPETITION'
  +' WHERE RUNNER = '+runnerID+' ORDER BY ACT_RESULT DESC, POINTS;';
  
  //  CASE WHEN R.DATE > DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN CASE WHEN (SELECT COUNT(POINTS) + 1 FROM RESULTS WHERE RUNNER = 1001 AND POINTS < R.POINTS AND DATE > DATE_SUB(NOW(), INTERVAL 1 YEAR)) END AS ORDER_PTS FROM RESULTS R LEFT JOIN COMPETITIONS C ON C.ID = R.COMPETITION WHERE RUNNER = 1001 ORDER BY POINTS;
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getCompetitionResults = function(competitionID, callback){
  var query = 'SELECT RESULTS.ID AS ID, COMPETITION, RUNNER, R.FULLNAME AS NAME, DATE, TIME, PLACE, POINTS, COMP_GROUP, DISTANCE, TIME_BEHIND'
  +' FROM RESULTS LEFT JOIN RUNNERS R ON R.ID = RUNNER'
  +' WHERE COMPETITION = '+competitionID+ ';';
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getRunnerDetails = function(runnerID, callback){
  var query = 'SELECT ID, FULLNAME, FIRST_NAME, LAST_NAME, BIRTH_DATE, TEAM, SEX, CUR_RANK FROM RUNNERS WHERE ID = '+runnerID+';';
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getCompetitionDetails = function(competitionID, callback){
  var query = 'SELECT ID, DATE, NAME, URL, TYPE, STATUS FROM COMPETITIONS WHERE ID = '+competitionID+ ';';
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};


module.exports.prepareDB = function(callback){
  
  //connection.connect();
  console.log('prepare');
  connection.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = "ORIENTEERING";', function(err, rows, fields) {
    if (!err){
      //console.log(rows);
      if(rows.length === 0){
        
        
        createDB(connection, function(){
          switchToDB(connection, function(){
            createTables(connection, function(){
              
              callback();
            });
          });
        });
      }else{
        switchToDB(connection, function(){
          callback();
        });
      }
    }
    else{
      console.log(err);
    }
  });
    
};

function createTables(connection, callback){
  var query = 'CREATE TABLE RUNNERS (ID MEDIUMINT NOT NULL AUTO_INCREMENT,' 
  +'FULLNAME nvarchar(100) NOT NULL, '
  +'FIRST_NAME nvarchar(50), '
  +'LAST_NAME nvarchar(50), '
  +'BIRTH_DATE nvarchar(15), '
  +'TEAM nvarchar(100), '
  +'SEX nvarchar(1), '
  +'CUR_RANK DECIMAL(5,2), PRIMARY KEY (ID));';
  
  
  
  connection.query(query, function(err, rows, fields) {
    if (err){
      
      console.log(err);
    }
    var query = 'CREATE TABLE COMPETITIONS (ID MEDIUMINT NOT NULL AUTO_INCREMENT,' 
  +'DATE DATETIME NOT NULL, '
  +'NAME nvarchar(300), '
  +'URL nvarchar(1000), '
  +'TYPE nvarchar(20), '
  +'WEB_ID MEDIUMINT, '
  +'NOTES nvarchar(1000), '
  +'STATUS nvarchar(20), PRIMARY KEY (ID));';
    connection.query(query, function(err, rows, fields) {
      if (err){
        console.log(err);
      }
      var query = 'CREATE TABLE RESULTS (ID MEDIUMINT NOT NULL AUTO_INCREMENT,' 
      +'COMPETITION INT NOT NULL, '
      +'RUNNER INT NOT NULL, '
      +'DATE DATETIME, '
      +'TIME DATETIME, '
      +'PLACE SMALLINT, '
      +'POINTS DECIMAL(5,2), '
      +'COMP_GROUP nvarchar(10), '
      +'DISTANCE nvarchar(1), ' //L,M,S,N...
      +'TIME_BEHIND nvarchar(15), PRIMARY KEY (ID));';
      
      connection.query(query, function(err, rows, fields) {
        if (err){
          console.log(err);
        }
        var query = 'ALTER TABLE RESULTS AUTO_INCREMENT=1001;';
        connection.query(query, function(err, rows, fields) {
          if (err){
            console.log(err);
          }
          
          var query = 'ALTER TABLE COMPETITIONS AUTO_INCREMENT=1001;';
          connection.query(query, function(err, rows, fields) {
            if (err){
              console.log(err);
            }
            
            var query = 'ALTER TABLE RUNNERS AUTO_INCREMENT=1001;'; 
            connection.query(query, function(err, rows, fields) {
              if (err){
                console.log(err);
              }
               var query = 'CREATE TABLE DUPLICATES (MAIN nvarchar(100) NOT NULL,' 
                +'VARIANT nvarchar(100) NOT NULL);'; 
                connection.query(query, function(err, rows, fields) {
                if (err){
                  console.log(err);
                }
                callback();
              });
            });
          });
        });
      });
    });
  });
}

function createDB(connection, callback){
   connection.query('CREATE DATABASE IF NOT EXISTS ORIENTEERING;', function(err, rows, fields) {
    if (!err){
      console.log('DB ORIENTEERING CREATED');
      callback();
    }
    else{
      
      console.log(err);
    }
      
  }); 
}

function switchToDB(connection, callback){
  
  connection.query('use ORIENTEERING;', function(err, rows, fields) {
    if (!err){
      console.log('SWITCHED TO ORIENTEERING');
      callback();
    }
    else
      console.log('Error while performing Query.');
  });
}

//with duplicates save
function addNewRunner(runner, callback){
  var query = 'INSERT INTO RUNNERS (FULLNAME, FIRST_NAME, LAST_NAME, TEAM, SEX) '
  + 'VALUES('
  +'"'+ runner.fullName+'",'
  +'"'+ runner.firstName+'",'  
  +'"'+ runner.lastName+'",'
  +'"'+ runner.team+'",'
  +'"'+ runner.sex+'"'
  +');';
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if(err){
      console.log(err);
    }
    var runnerID = rows.insertId;
    var query = 'INSERT INTO DUPLICATES (VARIANT, MAIN) '
    + 'VALUES('
    +'"'+ runner.fullName+'",'
    +'"'+ runner.fullName+'"'
    +');';
    //console.log(query);
    connection.query(query, function(err, rows, fields) {
     // console.log(rows);
      if (!err){
        
        var date = new Date(runner.date);
        //console.log(date);
        var points = defaultSettings.defaultPoints;
        //console.log('NEW RUNNER ID  '+ runner.fullName+' IS ' + runnerID);
        
        var query = 'INSERT INTO RESULTS '
        +'(COMPETITION, RUNNER, DATE, POINTS) '
        + 'VALUES ';
        for(var j=1; j<=6; j++){
          
          var targDate = new Date(date);
          targDate.setMonth(targDate.getMonth()-j);
          //console.log(targDate);
          query += '(' 
          + 0 + ', ' 
          + runnerID + ', ' //+ '"'+date.toMysqlFormat() +'"'+ ', '
          + "'" + targDate.toMysqlFormat()   +"'"+ ', ' 
          +  points
          + ')';
          
          if(j!= 6){
            query = query+ ',';
          }
        }
        query = query + ';';
        
        
        connection.query(query, function(err, rows, fields) {
          //console.log(query);
          if (!err){
            callback(null, runnerID);
          }else{
            callback(err);
          }
          
        });
      }else{
        console.log(query);
        console.log(err);
         callback(err);
      }
    
    });
  });
}


/*orderNumber: '1',
    numberBib: '363',
    lastName: 'Дьяченко',
    firstName: 'Вадим',
    team: 'КСО КОМПАС',
    result: '00:40:23',
    place: '1',
    timeBehind: '',
    fullName: 'Дьяченко Вадим' }
*/