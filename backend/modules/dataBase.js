'use strict';

var sql = require('mysql'),
    settings = require('./settings.js').getSQLSettings(),
    globalSettings = require('./settings.js').getSettings(),
    defaultSettings = require('./settings.js').getSettings();

//var connection = sql.createConnection(settings);

//console.log(settings);
/*connection.connect();

connection.query('SELECT * from TEST', function(err, rows, fields) {
  if (!err)
    console.log(rows[0].data + ' ' + rows[0].value);
  else
    console.log('Error while performing Query.');
});

connection.end();
//////////////////////////////////////////////////
*/
var connection;

function handleDisconnect() {
  connection = sql.createConnection(settings); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000);
      return;                             // We introduce a delay before attempting to reconnect,
    }
    switchToDB(connection, function(){
      var now = new Date();
      console.log('Reconnected to ORIENTEERING at ' + now.getDate() + " time: " +now.getHours() +":" +now.getMinutes());
    });                                      // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

//todo drop to date

//COMPETITIONS
module.exports.processCompetition = function(competition, callback){
  var status =(competition.STATUS && competition.STATUS==='invalid'?competition.STATUS:'imported');
  var allowed =(status ==='invalid'?'N':'Y');
  
  var query = 'UPDATE COMPETITIONS SET STATUS = '+ "'"+status+"'" +  ',' + ' IS_ALLOWED = '+ "'"+allowed+"'" + ',  NAME ='+ "'" +competition.NAME+ "'"+' WHERE ID = ' + competition.ID + ';';
  
 
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
  var query = 'SELECT ID, DATE, URL, NAME, TYPE, STATUS FROM COMPETITIONS WHERE STATUS = "valid" AND (IS_ALLOWED = "Y" OR IS_ALLOWED IS NULL)'
    + ' ORDER BY DATE;';
  
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      console.log('COMPETITIONS SELECTED');
      callback(null, rows);
    }
    else{
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
    }else{
      console.log(err);
      callback(err, null);
    }
  });
};

module.exports.getCompetitionsList = function(callback){
  var query = 'SELECT C.ID AS ID, NAME, C.DATE AS DATE, COUNT(RUNNER) AS RUNNERS, C.STATUS AS STATUS, C.URL AS URL, C.IS_ALLOWED AS IS_ALLOWED '
  +'FROM COMPETITIONS C '
  +'LEFT JOIN RESULTS ON RESULTS.COMPETITION = C.ID '
  +'GROUP BY C.ID ;';
  
  //SELECT  NAME, COUNT(RESULTS.ID) AS RUNNERS  FROM COMPETITIONS INNER JOIN RESULTS ON RESULTS.COMPETITION = COMPETITIONS.ID WHERE STATUS = 'SFR' GROUP BY COMPETITIONS.ID;
  
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      //console.log(rows);
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

module.exports.getCompetitionDetails = function(competitionID, callback){
  var query = 'SELECT ID, DATE, NAME, URL, TYPE, STATUS, IS_ALLOWED FROM COMPETITIONS WHERE ID = '+competitionID+ ';';
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

module.exports.updateCompetition = function(competition, callback){
  var query = 'UPDATE COMPETITIONS SET NAME = "' + competition.title + '" WHERE ID = ' +competition.id + ';';
  connection.query(query, function(err, rows, fields) {
    
    callback(err);
  });
};

module.exports.getDateToDropFrom = function(idArray, callback){
  var query = 'SELECT DATE FROM COMPETITIONS'
  +' WHERE  (IS_ALLOWED = "N" AND STATUS = "imported") OR (IS_ALLOWED = "Y" AND STATUS = "valid")'
  + ((idArray&&idArray.length>0)?' OR ID IN ('+ idArray.join(', ') +')':'')
  +' ORDER BY DATE LIMIT 1;';
  
  
  connection.query(query, function(err, rows, fields) {
    if(rows.length === 0){
      err = 'Nothing to update';
    }
    if (!err){
      console.log('COMPETITIONS SELECTED', rows);
      callback(null, rows[0].DATE);
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.updateCompetitionsStatus = function(competitions, callback){
  var query = 'UPDATE COMPETITIONS SET IS_ALLOWED = CASE';
  var idArray = [];
  
  for(var i = 0; i < competitions.length; i++){
    if(competitions[i].IS_ALLOWED_UPDATED !== competitions[i].IS_ALLOWED){
      idArray.push(competitions[i].ID);
    }else{
      continue;
    }
    query += ' WHEN ID = ' + competitions[i].ID + ' THEN '+ "'"+ competitions[i].IS_ALLOWED_UPDATED +"'";
  }
  
  if(idArray.length === 0){
      callback('noUpdates', null);
      return;
      
  }
  
  query += ' END WHERE ID IN (' +idArray.join(', ')+ ');';
  //console.log(query);
  
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      //console.log('COMPETITIONS UPDATED');
      callback(null, idArray);
    }
    else{
      console.log(err);
      callback(err);
    }
      
  });
  
};

//RUNNERS
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
        checkMainName(runner.fullName, function(error, fullname){
          addNewRunner(runner, function(error, runnerID){
            if(!error){
              //console.log(runnerID);
              id = runnerID;
              callback(null, id);
            }else{
              callback(error);
            }
          
          });
        });
        
      }else{
        //console.log('Old Used');
        id = rows[0].ID;
        callback(null, id);
      }
      
    }else{
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
      console.error(error);
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
     //console.log('BEST POINTS SELECTED');
     var points = new Array(3);
     points = rows.map(function(element){
       return element.CUR_RANK;
     });
     
     //console.log(points);
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
  console.log('current Update ' + (date?date.toMysqlFormat():' now'));
  
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
      var query = 'UPDATE RUNNERS,(SELECT RUNNER_ID, NAME, CASE WHEN COUNT(PTS) < 6 THEN ((6 - COUNT(PTS)) * '+globalSettings.maxPoints+'  + SUM(PTS))/6 ELSE AVG(PTS) END AS CUR_POINTS '
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
        console.log(fields);
        if (!err){
          //console.log('DB UPDATE COMPLETE');
          //callback();
        }else{
          console.log(err);
          //callback(err);
        }
        
        var query = 'UPDATE RUNNERS SET CUR_RANK = '+globalSettings.maxPoints+' WHERE CUR_RANK IS NULL;';
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

module.exports.updateRunnerDetails = function(runner, callback){
  var query = 'UPDATE RUNNERS SET TEAM   = '+ "'"+ runner.TEAM +"'"
  +' WHERE ID = ' + runner.ID;
 
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      callback(null);
    }
    else{
      callback(err);
    }
  });
  
};

module.exports.setDuplicates = function(mainName, duplicatesNames, callback){
  var query = 'DELETE FROM DUPLICATES WHERE VARIANT IN (';
  for(var i =0; i< duplicatesNames.length; i++){
    query += '"' +duplicatesNames[i]+ '"';
    if(i != duplicatesNames.length -1){
      query += ', ';
    }
  }
  query += ');';
  console.log(query);
  connection.query(query, function(err, rows, fields) {
   
    if (!err){
      var query = 'INSERT INTO DUPLICATES (MAIN, VARIANT) '
       + 'VALUES ';
      for(var j=1; j<duplicatesNames.length; j++){
        query += '(' 
        + '"' + mainName + '", ' 
        + '"' + duplicatesNames[j]+'"'
        + ')';
        
        if(j!= duplicatesNames.length-1){
          query = query+ ',';
        }
      }
      query = query + ';';
      connection.query(query, function(err, rows, fields) {
        console.log(query);
        if (!err){
          callback(null);
        }
        else{
          callback(err);
        }
      });
    }else{
      callback(err);
    }
  });
};

//RESULTS
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
      //console.log('RESULTS ADDED');
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

module.exports.getEarliestResultDate = function(runnersIDs, callback){
  var query = 'SELECT DATE FROM RESULTS WHERE COMPETITION <> 0 AND RUNNER IN ('+runnersIDs.join(', ')+') ORDER BY DATE ASC LIMIT 1';
 
  connection.query(query, function(err, rows, fields) {
    
    if (!err && rows.length > 0){
      callback(null, rows[0].DATE);
    }else{
      callback(err);
    }
  });
  
};

//MAIN
module.exports.rollBackToDate = function(date, callback){
  //update Competitions (changeStatus)
  //clear results (if none left - clear subjective too)
  //clear runners with no results (and with subjective too)
  
  //TODO
  //check logic!!!
  
  
  
  var query = 'UPDATE COMPETITIONS SET STATUS = "' + 'valid' + '" WHERE STATUS <> "invalid" AND DATE >= "'+date.toMysqlFormat() + '";';
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      var query = 'DELETE FROM RESULTS WHERE COMPETITION IN (SELECT ID FROM COMPETITIONS WHERE STATUS = "valid");';
      //console.log(query);
      connection.query(query, function(err, rows, fields) {
      if (!err){
        
         var query = 'DELETE FROM RUNNERS WHERE ID IN (SELECT RUNNER FROM RESULTS GROUP BY RUNNER HAVING COUNT(RUNNER)=6);';
         //console.log(query);
         connection.query(query, function(err, rows, fields) {
          if (!err){
            //console.log(query);
            var query = 'DELETE FROM RESULTS WHERE RUNNER NOT IN (SELECT DISTINCT ID FROM RUNNERS);';
            connection.query(query, function(err, rows, fields) {
              if (!err){
                //console.log(query);
                callback(null);
              }else{
                //console.log(err);
                callback(err);
              }
                
            });
           
          }else{
            console.log(err);
            callback(err);
          }
            
        });
        
       
      }else{
        console.log(err);
        callback(err);
      }
        
    });
      
      
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};



//DB
module.exports.prepareDB = function(callback){
  
  //connection.connect();
  console.log('prepare DB');
  connection.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = "ORIENTEERING";', function(err, rows, fields) {
    if (!err){
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
      console.error(err);
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
  +'IS_ALLOWED nvarchar(1), ' //Y, N
  +'STATUS nvarchar(20), PRIMARY KEY (ID));'; // valid, invalid, imported
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
                +'VARIANT nvarchar(100) NOT NULL, PRIMARY KEY(VARIANT));'; 
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
      //console.log('DB ORIENTEERING CREATED');
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
      //console.log('SWITCHED TO ORIENTEERING');
      callback();
    }else{
       console.error('Error while performing Query. ' + err);
    }
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
    var date = new Date(runner.date);
    
    var points = defaultSettings.defaultPoints;
  
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
  });
}

function checkMainName(runnerName, callback){
  var query = 'SELECT MAIN FROM DUPLICATES WHERE VARIANT = "' + runnerName+'" LIMIT 1;'
  connection.query(query, function(err, rows, fields) {
    if (!err){
      if(rows.length === 0){
        var query = 'INSERT INTO DUPLICATES (VARIANT, MAIN) '
        + 'VALUES( "'+ runnerName+'",'
        +'"'+ runnerName+'" );';
        connection.query(query, function(err, rows, fields) {
          if (!err){
              callback(null, runnerName);
          }else{
            callback(err);
          }
        });
      }else{
        callback(null, rows[0]);
      }
    }else{
      callback(err);
    }
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