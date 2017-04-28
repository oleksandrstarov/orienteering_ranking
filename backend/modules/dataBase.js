'use strict';

var sql = require('mysql'),
    settings = require('./settings.js').getSQLSettings(),
    globalSettings = require('./settings.js').getSettings();
    //defaultSettings = require('./settings.js').getSettings();



//var connection = sql.createConnection(settings);

////console.log(settings);
/*connection.connect();

connection.query('SELECT * from TEST', function(err, rows, fields) {
  if (!err)
    //console.log(rows[0].data + ' ' + rows[0].value);
  else
    //console.log('Error while performing Query.');
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
      //console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000);
      return;                             // We introduce a delay before attempting to reconnect,
    }
    switchToDB(connection, function(){
      var now = new Date();
      //console.log('Reconnected to ORIENTEERING at ' + now.getDate() + " time: " +now.getHours() +":" +now.getMinutes());
    });                                      // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    //console.log('db error', err);
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
  if(!competition){
    callback('Error, competition is null!');
  }
  var status =(competition.STATUS && competition.STATUS==='INVALID'?competition.STATUS:'IMPORTED');
  //console.log(status);
  var allowed =(status ==='INVALID'?'N':'Y');
  
  var query = 'UPDATE COMPETITIONS SET UPDATED_DATE = NOW(), STATUS = '+ "'"+status+"'" +  ',' + ' IS_ALLOWED = '+ "'"+allowed+"'" + ',  NAME ='+ "'" +competition.NAME+ "'" +',  NOTES ='+ "'" +competition.NOTES+ "'"+' WHERE ID = ' + competition.ID + ';';
  
 
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      //console.log('COMPETITION UPDATED');
      callback();
    }
    else{
      //console.log('COMPETITION FAILED ' + query);
      //console.log(err);
      callback(err);
    }
  });
};

module.exports.saveNewCompetitions = function(competitions, callback){
  var query = 'INSERT INTO COMPETITIONS (DATE, URL, NAME, TYPE, STATUS, WEB_ID, NOTES, CREATED_DATE, UPDATED_DATE) '
  + 'VALUES';
  for(var i = 0; i < competitions.length; i++){
    query += '(' 
    + "'" + competitions[i].date   +"'"+ ', '
    + "'" + competitions[i].url   +"'"+ ', ' 
    + "'" + competitions[i].title+ "'" + ', '
    +"'" + competitions[i].type +"'"+ ', ' //SFR, WINORIENT, unknown
    +"'" +(competitions[i].isValid ? "VALID": "INVALID") +"'"+ ', '  //ready, VALID, INVALID
    + competitions[i].id + ', '//web id for competitions from federation web page
    + "'" +competitions[i].notes +"'"  + ', '
    +'NOW(), NOW()'
    + ')';
    
     if(i!= competitions.length -1){
        query += ', ';
      }else{
        query += ';';
      }
  }
  
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      //console.log('COMPETITIONS ADDED');
      callback();
    }
    else{
      //console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getReadyToImportCompetitions = function(callback){
  var query = 'SELECT ID, DATE, URL, NAME, TYPE, STATUS, NOTES FROM COMPETITIONS WHERE STATUS = "VALID" AND (IS_ALLOWED = "Y" OR IS_ALLOWED IS NULL) '
    + ' ORDER BY DATE;';
  
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      //console.log('COMPETITIONS SELECTED');
      callback(null, rows);
    }
    else{
      //console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getImportedCompetitionsIDs = function(callback){
  var query = 'SELECT WEB_ID FROM COMPETITIONS WHERE WEB_ID IS NOT NULL;';
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      //console.log(err);
      callback(err, null);
    }
  });
};

module.exports.getCompetitionsList = function(callback){
  return new Promise(function(resolve, reject){
    var query = 'SELECT C.ID AS ID, NAME, C.DATE AS DATE, COUNT(RUNNER) AS RUNNERS, C.STATUS AS STATUS, C.URL AS URL, C.IS_ALLOWED AS IS_ALLOWED, C.NOTES '
    +'FROM COMPETITIONS C '
    +'LEFT JOIN RESULTS ON RESULTS.COMPETITION = C.ID '
    +'GROUP BY C.ID ;';
    
    //SELECT  NAME, COUNT(RESULTS.ID) AS RUNNERS  FROM COMPETITIONS INNER JOIN RESULTS ON RESULTS.COMPETITION = COMPETITIONS.ID WHERE STATUS = 'SFR' GROUP BY COMPETITIONS.ID;
    
    ////console.log(query);
    connection.query(query, function(err, rows, fields) {
      if (!err){
        ////console.log(rows);
        resolve(['competitions', rows]);
      }else{
        //console.log(err);
        reject(err);
      }
        
    });
  });
};

module.exports.getCompetitionResults = function(competitionID, callback){
  var query = 'SELECT RESULTS.ID AS ID, COMPETITION, RUNNER, R.FULLNAME AS NAME, DATE, TIME, PLACE, POINTS, COMP_GROUP, DISTANCE, TIME_BEHIND'
  +' FROM RESULTS LEFT JOIN RUNNERS R ON R.ID = RUNNER'
  +' WHERE COMPETITION = '+competitionID+ ';';
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      //console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getCompetitionDetails = function(competitionID, callback){
  var query = 'SELECT ID, DATE, NAME, URL, TYPE, STATUS, IS_ALLOWED FROM COMPETITIONS WHERE ID = '+competitionID+ ';';
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      //console.log(err);
      callback(err);
    }
      
  });
};

module.exports.updateCompetition = function(competition, callback){
  var query = 'UPDATE COMPETITIONS SET UPDATED_DATE = NOW(), NAME = "' + competition.title + '" WHERE ID = ' +competition.id + ';';
  connection.query(query, function(err, rows, fields) {
    
    callback(err);
  });
};

module.exports.getDateToDropFrom = function(idArray, callback){
  var query = 'SELECT DATE FROM COMPETITIONS'
  +' WHERE  (IS_ALLOWED = "N" AND STATUS = "IMPORTED") OR (IS_ALLOWED = "Y" AND STATUS = "VALID")'
  + ((idArray&&idArray.length>0)?' OR ID IN ('+ idArray.join(', ') +')':'')
  +' ORDER BY DATE LIMIT 1;';
  
  connection.query(query, function(err, rows, fields) {
    if(rows.length === 0){
      err = 'Nothing to update';
    }
    if (!err){
      callback(null, rows[0].DATE);
    }else{
      console.log(err);
      callback(err);
    }
      
  });
};

module.exports.updateCompetitionsStatus = function(competitions, callback){
  var query = 'UPDATE COMPETITIONS SET UPDATED_DATE = NOW(), IS_ALLOWED = CASE';
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
  ////console.log(query);
  
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
    
    if (!err){
      console.log('COMPETITIONS UPDATED');
      callback(null, idArray);
    }
    else{
      //console.log(err);
      callback(err);
    }
      
  });
  
};

//RUNNERS
function getPersonID(runner, points, callback){
  if(!runner){
    callback('NO VALID RUNNER DATA');
    return;
  }
  
  var query = 'SELECT ID, ACTIVE FROM RUNNERS INNER JOIN DUPLICATES ON FULLNAME = MAIN WHERE VARIANT = '+ '"' + runner.fullName+'"'+ ' LIMIT 1;'
  connection.query(query, function(err, rows, fields) {
    if (!err){
      var id = null;
      if(rows.length === 0 || rows[0].ACTIVE == 0){
        if(rows.length != 0){
          runner.id = rows[0].ID;
          runner.active = rows[0].ACTIVE;
        }
        checkMainName(runner.fullName, function(error, fullname){
          runner.fullName = fullname;
          addNewRunner(runner, points, function(error, runnerID){
            if(!error){
              id = runnerID;
              callback(null, id);
            }else{
              console.log(error);
              callback(error);
            }
          
          });
        });
        
      }else{
        id = rows[0].ID;
        callback(null, id);
      }
    }else{
      callback(err);
    }
      
  });
};

module.exports.setRunnersIDs = function(competition, callback){
  
  var i = 0;
  var j = 0;
  
  if(competition.group[i] && competition.group[i].data[j]){
    competition.group[i].data[j].date = competition.DATE;
  }
  
  //console.log(competition.group.length);
  getPersonID(competition.group[i].data[j],competition.group[i].shift, getPersonIDcallback);
  
  var self = this;
  function getPersonIDcallback(error, id){
    
    if(error){
      console.log(error);
    }
    if(id){
      ////console.log(competition.group[i].data[j]);
      competition.group[i].data[j].id = id;
    }
    //console.log('test', j +1, competition.group[i].data.length);
    if(++j === competition.group[i].data.length){
      j = 0;
      i++;
    }
    //console.log(competition.group[i].data.length);
    //console.log(i + " " + j,competition.group.length);
    if(i < competition.group.length && j < competition.group[i].data.length){
      //console.log(i + " " + j + " New entry");
      if(competition.group[i].data[j]){
        competition.group[i].data[j].date = competition.DATE;
      }
      //console.log('getId');
      getPersonID(competition.group[i].data[j],competition.group[i].shift, getPersonIDcallback);
    }else{
      //console.log('else');
      //console.log(competition.group.length,competition.group[i].data.length, i, j);
      callback(null, competition);
    }
  }
};

module.exports.getBestThreePoints = function(persons,  callback){
  var query = 'SELECT CUR_RANK FROM RUNNERS INNER JOIN DUPLICATES ON MAIN = FULLNAME WHERE ACTIVE = 1 AND VARIANT IN ('+ persons + ') ORDER BY CUR_RANK LIMIT 3;'
  
  connection.query(query, function(err, rows, fields) {
   
    if (!err){
     ////console.log('BEST POINTS SELECTED');
     var points = new Array(3);
     points = rows.map(function(element){
       return element.CUR_RANK;
     });
     
     ////console.log(points);
     
     callback(null, points);
      
    }else{
      //console.log(err);
      callback(err);
    }
  });
};

module.exports.updateCurrentRanking = function(date, callback){
  //console.log('current Update ' + (date?date.toMysqlFormat():' now'));
  
  if(!date){
    var dateParam = 'DATE(NOW())';
  }else{
    date = new Date(date);
    var dateParam = "'" + date.toMysqlFormat()+"'";
  }
  
  var query = 'UPDATE RUNNERS SET CUR_RANK = NULL, SUBJECTIVE = "N";';
    // var query = 'SELECT 1;';
                
    ////console.log(query);
    connection.query(query, function(err, rows, fields) {
      if(err){
        console.log(err);
      }
      ////console.log(dateParam);
      var query =  `
        UPDATE RUNNERS,
        (SELECT RUNNER_ID, 
                NAME, 
                (
                  (IF(${globalSettings.startsAmount} - COUNT(PTS)<=SUBJ,(${globalSettings.startsAmount} - COUNT(PTS)), SUBJ)* SUBJ_VAL  
                + IF((${globalSettings.startsAmount} - COUNT(PTS) - SUBJ)>0,(${globalSettings.startsAmount} - COUNT(PTS) - SUBJ)* ${globalSettings.maxPoints}, 0)  
                + SUM(PTS))/${globalSettings.startsAmount}) AS CUR_POINTS, 
                COUNT(PTS) AS RESULT_COUNT, 
                SUBJ 
        FROM 
          (SELECT RUNNERS.ID RUNNER_ID, FULLNAME NAME, CUR_RANK CUR_POINTS, POINTS PTS, RESULTS.ID AS RESULT_ID, 
            (SELECT COUNT(*) FROM RESULTS WHERE RUNNER = RUNNERS.ID AND COMPETITION = 0 AND DATE > DATE_SUB(${dateParam}, INTERVAL 1 YEAR)) AS SUBJ,
            (SELECT DISTINCT POINTS FROM RESULTS WHERE RUNNER = RUNNERS.ID AND COMPETITION = 0) AS SUBJ_VAL 
             FROM RUNNERS 
            INNER JOIN RESULTS ON RESULTS.RUNNER = RUNNERS.ID 
            WHERE DATE > DATE_SUB(${dateParam}, INTERVAL 1 YEAR) AND COMPETITION <> 0
            ) AS OUTER_PROP 
          WHERE ( 
          SELECT COUNT(*) FROM (SELECT RUNNERS.ID RUNNER_ID, FULLNAME NAME, CUR_RANK CUR_POINTS, POINTS PTS , RESULTS.ID AS RESULT_ID 
          FROM RUNNERS 
          INNER JOIN RESULTS ON RESULTS.RUNNER = RUNNERS.ID 
          WHERE DATE > DATE_SUB(${dateParam}, INTERVAL 1 YEAR) AND COMPETITION <> 0
          ) AS INNER_PROP 
          WHERE INNER_PROP.RUNNER_ID = OUTER_PROP.RUNNER_ID AND 
          (CASE WHEN INNER_PROP.PTS <> OUTER_PROP.PTS THEN INNER_PROP.PTS < OUTER_PROP.PTS ELSE INNER_PROP.RESULT_ID < OUTER_PROP.RESULT_ID END) 
          ) < ${globalSettings.startsAmount}
          GROUP BY RUNNER_ID ORDER BY RUNNER_ID) AS TEMP_PROP 
        SET RUNNERS.CUR_RANK = TEMP_PROP.CUR_POINTS, UPDATED_DATE = NOW(), RUNNERS.SUBJECTIVE = (CASE WHEN (${globalSettings.startsAmount} - RESULT_COUNT > 0) AND (SUBJ > 0) THEN "Y" ELSE "N" END)
        WHERE RUNNERS.ID = TEMP_PROP.RUNNER_ID;
        `;
      connection.query(query, function(err, rows, fields) {
        
        if (!err){
          //console.log('DB UPDATE COMPLETE');
          //callback();
        }else{
          console.log('update err', query, err);
          //callback(err);
        }
        var query = `
          UPDATE RUNNERS SET CUR_RANK = ${globalSettings.maxPoints} WHERE CUR_RANK IS NULL;
        `;
        // var query = 'SELECT 1;';
                    
        ////console.log(query);
        connection.query(query, function(err, rows, fields) {
          ////console.log('selected');
          if (!err){
            ////console.log('DB UPDATE WITH MAX POINTS COMPLETE');
            callback();
          }else{
            //console.log(err);
            callback(err);
          }
            
        });
      });
    });
};

module.exports.getRunnersList = function(){
  return new Promise(function(resolve, reject){
  
    var query = `SELECT *, POINTS - CUR_RANK AS POINTS_DIFF, PLACE - CUR_PLACE AS PLACE_DIFF
      FROM (
        SELECT R.ID, FULLNAME, TEAM, SEX, S1.POINTS AS CUR_RANK, SUBJECTIVE, S.POINTS, S.PLACE, S1.PLACE AS CUR_PLACE
        FROM RUNNERS R 
        JOIN STATISTICS S1 ON S1.RUNNER_ID = R.ID AND S1.ENTRY_DATE = (SELECT max(ENTRY_DATE) FROM STATISTICS)
        LEFT JOIN STATISTICS S ON S.RUNNER_ID = R.ID AND S.ENTRY_DATE = DATE_SUB((SELECT max(ENTRY_DATE) FROM STATISTICS) , INTERVAL 7 DAY)
        WHERE ACTIVE = 1 ORDER BY S1.POINTS) TEMP
      ORDER BY SEX, CUR_RANK;`;
   
    connection.query(query, function(err, rows, fields) {
      if (!err){
        resolve(['runners', rows]);
      }else{
        reject(err);
      }
    });    
  });
};

module.exports.getRunnerResults = function(runnerID, callback){
  var query = `
    SELECT R.ID AS ID, COMPETITION, NAME, RUNNER, R.DATE AS DATE, TIME, PLACE, POINTS, COMP_GROUP AS 'GROUP', DISTANCE, TIME_BEHIND,
    CASE WHEN R.DATE > DATE_SUB(DATE((SELECT max(ENTRY_DATE) FROM STATISTICS)), INTERVAL 1 YEAR) THEN "C" ELSE "P" END AS ACT_RESULT, CASE WHEN COMPETITION <> 0 THEN 1 ELSE 0 END AS COMP_RESULT
    FROM RESULTS R
    LEFT JOIN COMPETITIONS C ON C.ID = COMPETITION
    WHERE RUNNER = ${runnerID} ORDER BY ACT_RESULT ASC, COMP_RESULT DESC, POINTS;
  `;
  
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      callback(err);
    }
      
  });
};

module.exports.getRunnerDetails = function(runnerID, callback){
  var query = `SELECT R.ID, FULLNAME, BIRTH_DATE, TEAM, SEX, S.POINTS AS CUR_RANK, S.PLACE FROM RUNNERS R
    JOIN STATISTICS S ON R.ID = S.RUNNER_ID AND ENTRY_DATE = (SELECT max(ENTRY_DATE) FROM STATISTICS)
    WHERE R.ID = ${runnerID};`;
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      callback(null, rows);
    }else{
      //console.log(err);
      callback(err);
    }
      
  });
};

module.exports.updateRunnerDetails = function(runner, callback){
  var query = `
      UPDATE RUNNERS SET UPDATED_DATE = NOW(), 
      TEAM   = '${runner.TEAM}',
      SEX   = '${runner.SEX}',
      LOCK_DATA = 1
      WHERE ID = ${runner.ID};
  `;
 
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
  console.log(mainName, duplicatesNames);
  var query = 'UPDATE DUPLICATES SET MAIN = "' + mainName +'" WHERE VARIANT IN (';
  for(var i =0; i< duplicatesNames.length; i++){
    query += '"' +duplicatesNames[i]+ '"';
    if(i != duplicatesNames.length -1){
      query += ', ';
    }
  }
  query += ');';
  //console.log(query);
  connection.query(query, function(err, rows, fields) {
    if (!err){
      var query = 'DELETE FROM RUNNERS WHERE FULLNAME IN ('
      for(var i =0; i< duplicatesNames.length; i++){
        query += '"' +duplicatesNames[i]+ '"';
        if(i != duplicatesNames.length -1){
          query += ', ';
        }
      }
      query += ');';
      connection.query(query, function(err, rows, fields) {
        //console.log(query);
        if(!err){
          //console.log(err);
          callback();
        }else{
          console.log(err);
        }
      });
    }else{
      callback(err);
    }
  });
};

//RESULTS

//?????????????????????
module.exports.addResults = function(competition, callback){
  
  if(competition.STATUS !== 'VALID'){
    callback('INVALID STATUS');
    return;
  }
  
  var query = 'INSERT INTO RESULTS '
  +'(COMPETITION, RUNNER, DATE, TIME, PLACE, POINTS, DISTANCE, TIME_BEHIND, COMP_GROUP, CREATED_DATE) '
  + 'VALUES ';
  
  var runners = [];
  
  for(var i=0; i<competition.group.length; i++){
    var group = competition.group[i];
    for(var j=0; j<group.data.length; j++){
      ////console.log(group.data[j].id);
      query += '(' 
      + competition.ID + ', ' 
      + group.data[j].id + ', ' 
      + "'" + competition.DATE.toMysqlFormat()   +"'"+ ', ' 
      + "'" + group.data[j].result + "'" + ', '
      +  group.data[j].place + ', '
      +  group.data[j].points + ', '
      + "'" +  'L' + "'" + ', '
      +  "'" + group.data[j].timeBehind + "', "
      +  "'" + group.name + "'" + ', '
      + 'NOW()'
      + '), ';
      
      runners.push(group.data[j]);
    }
  }
  query = query.replace(/\,.$/, ';');
  //console.log(query.length);
  //console.log(query);
  
  connection.query(query, function(err, rows, fields) {
    if (!err){
      updateRunnersDetails(runners, function(){
         callback();
      });
    }else{
      console.log(query);
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
  
  
  
  var query = 'UPDATE COMPETITIONS SET STATUS = "' + 'VALID' + '", UPDATED_DATE = NOW() WHERE STATUS != "INVALID" AND DATE >= "'+date.toMysqlFormat() + '";';
  ////console.log(query);
  connection.query(query, function(err, rows, fields) {
   
    if (!err){
      var query = 'DELETE FROM RESULTS WHERE COMPETITION IN (SELECT ID FROM COMPETITIONS WHERE STATUS = "VALID");';
      ////console.log(query);
      connection.query(query, function(err, rows, fields) {
      
      if (!err){
        
         var query = `
          UPDATE RUNNERS SET ACTIVE = 0, UPDATED_DATE = NOW() WHERE ID IN (SELECT RUNNER FROM RESULTS GROUP BY RUNNER HAVING COUNT(RUNNER)=${globalSettings.startsAmount});
         `;
         ////console.log(query);
         connection.query(query, function(err, rows, fields) {
          
          if (!err){
            ////console.log(query);
            var query = 'DELETE FROM RESULTS WHERE RUNNER NOT IN (SELECT DISTINCT ID FROM RUNNERS WHERE ACTIVE = 1);';
            connection.query(query, function(err, rows, fields) {
              
              if (!err){
                ////console.log(query);
                var query = `DELETE FROM STATISTICS WHERE ENTRY_DATE >= '${date.toMysqlFormat()}';`;
                connection.query(query, function(err, rows, fields) {
                 
                  if (!err){
                    ////console.log(query);
                    callback(null);
                  }else{
                    ////console.log(err);
                    callback(err);
                  }
                    
                });
              }else{
                ////console.log(err);
                callback(err);
              }
                
            });
           
          }else{
            //console.log(err);
            callback(err);
          }
            
        });
        
       
      }else{
        //console.log(err);
        callback(err);
      }
        
    });
      
      
    }else{
      //console.log(err);
      callback(err);
    }
      
  });
};

module.exports.getStatistic = function(){
  //params total, active, superactive, competitions, activecomps, mostfreq, starts,  mostfreq year, starts year, latest comp, latest update
  return new Promise(function(resolve, reject){
    var stats = {};
    var query =  `(SELECT COUNT(*) AS DATA FROM RUNNERS WHERE ACTIVE = 1) 
          UNION ALL 
          (SELECT COUNT(*) FROM RUNNERS WHERE ID IN (SELECT DISTINCT RUNNER FROM RESULTS WHERE DATE > DATE_SUB((SELECT MAX(ENTRY_DATE) FROM STATISTICS), INTERVAL 1 YEAR) AND COMPETITION != 0) AND ACTIVE =1)  
          UNION ALL
          (SELECT COUNT(*) FROM RUNNERS WHERE ID IN (SELECT DISTINCT RUNNER FROM RESULTS WHERE DATE > DATE_SUB((SELECT MAX(ENTRY_DATE) FROM STATISTICS), INTERVAL 1 YEAR) AND COMPETITION != 0 GROUP BY RUNNER HAVING COUNT(RUNNER)>=${globalSettings.startsAmount}) AND ACTIVE =1  )
          UNION ALL 
          (SELECT COUNT(ID) FROM COMPETITIONS)
          UNION ALL 
          (SELECT COUNT(ID) FROM COMPETITIONS WHERE DATE > DATE_SUB((SELECT MAX(ENTRY_DATE) FROM STATISTICS), INTERVAL 1 YEAR))
          UNION ALL 
          (SELECT DATE_FORMAT(MAX(DATE),"%d-%m-%Y") FROM COMPETITIONS) 
          UNION ALL 
          (SELECT DATE_FORMAT(MAX(ENTRY_DATE),"%d-%m-%Y") FROM STATISTICS)
          UNION ALL 
          (SELECT (SELECT FULLNAME FROM RUNNERS WHERE ID = RUNNER) FROM RESULTS GROUP BY RUNNER ORDER BY COUNT(RUNNER) DESC LIMIT 1) `;
    
    connection.query(query, function(err, rows, fields) {
      if (!err){
        stats.simpleStats = rows;
          var query = `SELECT R.ID AS ID, FULLNAME, SEX, POINTS, PLACE, 
          DATEDIFF((SELECT MAX(ENTRY_DATE) FROM STATISTICS),
          COALESCE((SELECT MAX(ENTRY_DATE) FROM STATISTICS WHERE RUNNER_ID = R.ID AND PLACE != S.PLACE),
          (SELECT MIN(ENTRY_DATE) FROM STATISTICS WHERE RUNNER_ID = R.ID)))/7 AS DURATION 
          FROM STATISTICS S 
          INNER JOIN RUNNERS R ON R.ID = S.RUNNER_ID
          WHERE ENTRY_DATE = (SELECT MAX(ENTRY_DATE) FROM STATISTICS) AND PLACE <= 3 ORDER BY SEX, PLACE ASC`;
        
        connection.query(query, function(err, rows, fields) {
          if (!err){
            stats.leaders = rows;
            var query = ` 
             (SELECT (SELECT FULLNAME FROM RUNNERS WHERE ID = RUNNER) AS FULLNAME,RUNNER AS ID, COUNT(RUNNER) AS AMOUNT, 'A' AS PERIOD 
              FROM RESULTS WHERE COMPETITION != 0 GROUP BY RUNNER 
              HAVING COUNT(RUNNER) = (SELECT COUNT(RUNNER) FROM RESULTS WHERE COMPETITION != 0 GROUP BY RUNNER ORDER BY COUNT(RUNNER) DESC LIMIT 1)  
              ORDER BY COUNT(RUNNER) DESC)
              UNION ALL
              (SELECT (SELECT FULLNAME FROM RUNNERS WHERE ID = RUNNER) AS FULLNAME,RUNNER AS ID, COUNT(RUNNER) AS AMOUNT, 'Y' AS PERIOD 
              FROM RESULTS WHERE COMPETITION != 0  AND DATE > DATE_SUB((SELECT MAX(ENTRY_DATE) FROM STATISTICS), INTERVAL 1 YEAR) GROUP BY RUNNER  
              HAVING COUNT(RUNNER) = (SELECT COUNT(RUNNER) FROM RESULTS WHERE COMPETITION != 0 AND DATE > DATE_SUB((SELECT MAX(ENTRY_DATE) FROM STATISTICS), INTERVAL 1 YEAR) GROUP BY RUNNER ORDER BY COUNT(RUNNER) DESC LIMIT 1)  
              ORDER BY COUNT(RUNNER) DESC) 
              ORDER BY PERIOD, AMOUNT DESC`;
            
            connection.query(query, function(err, rows, fields) {
              if (!err){
                stats.attenders = rows;
                resolve(['statistics', stats]);
              }else{
                //console.log(1,err);
                reject(err);
              }
            });
          }else{
            //console.log(1,err);
            reject(err);
          }
        });
      }else{
        //console.log(0, err);
        reject(err);
      }
        
    });    
  });
};

//DB
module.exports.prepareDB = function(callback){
  
  //connection.connect();
  //console.log('prepare DB');
  /*connection.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = "ORIENTEERING";', function(err, rows, fields) {
    if (!err){
      if(rows.length === 0){*/
        createDB(connection, function(){
          switchToDB(connection, function(){
            
            createTables(connection, function(){
              
              callback();
            });
          });
        });
      /*}else{
        switchToDB(connection, function(){
          callback();
        });
      }
    }else{
      //console.error(err);
    }
  });*/
    
};

module.exports.setPointsStatistic = function(date){
  return new Promise(function(resolve, reject){
    var query = `INSERT INTO STATISTICS (RUNNER_ID, ENTRY_DATE, POINTS, PLACE)
    SELECT ID, '${date.toMysqlFormat()}', CUR_RANK, (SELECT COUNT(*) + 1 FROM RUNNERS WHERE CUR_RANK < R.CUR_RANK AND SEX = R.SEX AND ACTIVE = 1) FROM RUNNERS R WHERE ACTIVE = 1`;
    
    connection.query(query, function(err, rows, fields) {
      if (!err){
        resolve();
      }else{
        console.log(err);
        reject(err);
      }
    });
  }) 
};

module.exports.getPointsStatistic = function(runnerID){
  
  //TODO -- save statistics
  return new Promise(function(resolve, reject){
    var query = `
    SELECT ENTRY_DATE, POINTS, PLACE FROM STATISTICS WHERE RUNNER_ID = ${runnerID};
    `;
    connection.query(query, function(err, rows, fields) {
      if (!err){
        
        resolve(rows);
      }else{
         reject(err);
      }
    });
  }) 
};

module.exports.getLatestUpdateDateStatistic = function(){
  
  return new Promise(function(resolve, reject){
    var query = `
      SELECT MAX(ENTRY_DATE) AS DATE FROM STATISTICS;
    `;
    connection.query(query, function(err, rows, fields) {
      if (!err){
        resolve(rows);
      }else{
         reject(err);
      }
    });
  }) 
};

module.exports.dropData = function(){
  //params total, active, superactive, competitions, activecomps, mostfreq, starts,  mostfreq year, starts year, latest comp, latest update
  return new Promise(function(resolve, reject){
    var query = `UPDATE COMPETITIONS SET STATUS = 'VALID', UPDATED_DATE = NOW() WHERE STATUS != 'INVALID';`;
    connection.query(query, function(err, rows, fields) {
      if (!err){
        var query = 'DROP TABLE RESULTS;';
        connection.query(query, function(err, rows, fields) {
        if (!err){
           var query = `UPDATE RUNNERS SET ACTIVE = 0, UPDATED_DATE = NOW(), CUR_RANK = NULL;`;
           ////console.log(query);
           connection.query(query, function(err, rows, fields) {
            if (!err){
              ////console.log(query);
              var query = `DROP TABLE STATISTICS;`;
              connection.query(query, function(err, rows, fields) {
               
                if (!err){
                  ////console.log(query);
                  createTables(connection , function(){
                    resolve();
                  });
                  
                }else{
                  ////console.log(err);
                  reject(err);
                }
                  
              });
            }else{
              ////console.log(err);
              reject(err);
            }
              
          });
        }else{
          //console.log(err);
          reject(err);
        }
          
      });
        
        
      }else{
        //console.log(err);
        reject(err);
      }
        
    });
  });
  
};

function createTables(connection, callback){
  var query = 'CREATE TABLE IF NOT EXISTS RUNNERS (ID MEDIUMINT NOT NULL AUTO_INCREMENT,' 
  +'FULLNAME nvarchar(100) NOT NULL, '
  +'BIRTH_DATE nvarchar(15), '
  +'TEAM nvarchar(100), '
  +'SEX ENUM("M", "W"), '
  +'LOCK_DATA BIT(1) DEFAULT 0, '
  +'ACTIVE nvarchar(1), '
  +'CUR_RANK DECIMAL(5,2), '
  +'SUBJECTIVE ENUM("Y", "N"), '
  +'CREATED_DATE DATETIME, '
  +'UPDATED_DATE DATETIME, '
  +'PRIMARY KEY (ID)) '
  +'AUTO_INCREMENT=1001;';
  
  
  
  connection.query(query, function(err, rows, fields) {
    console.log(query);
    if (err){
      console.log(err);
    }
    var query = `CREATE TABLE IF NOT EXISTS COMPETITIONS (
    ID MEDIUMINT NOT NULL AUTO_INCREMENT,
    DATE DATETIME NOT NULL, 
    NAME nvarchar(300), 
    URL nvarchar(1000), 
    TYPE nvarchar(20), 
    WEB_ID MEDIUMINT, 
    NOTES nvarchar(1000), 
    IS_ALLOWED ENUM("Y", "N"), 
    STATUS ENUM("VALID", "INVALID", "IMPORTED"), 
    CREATED_DATE DATETIME, 
    UPDATED_DATE DATETIME, 
    PRIMARY KEY (ID)) AUTO_INCREMENT=1001;`
    ; 
    connection.query(query, function(err, rows, fields) {
      if (err){
        //console.log(err);
      }
      var query = `CREATE TABLE IF NOT EXISTS RESULTS (ID MEDIUMINT NOT NULL AUTO_INCREMENT, 
      COMPETITION INT NOT NULL, 
      RUNNER INT NOT NULL, 
      DATE DATETIME, 
      TIME NVARCHAR(10), 
      PLACE SMALLINT, 
      POINTS DECIMAL(5,2),
      DISTANCE ENUM("LONG", "MIDDLE", "SPRINT", "NIGHT"), 
      COMP_GROUP nvarchar(10),
      TIME_BEHIND nvarchar(15),
      CREATED_DATE DATETIME, 
      PRIMARY KEY (ID)) AUTO_INCREMENT=1001;
      `;
      
      connection.query(query, function(err, rows, fields) {
        if (err){
          //console.log(err);
        }
        var query = `CREATE TABLE IF NOT EXISTS DUPLICATES (MAIN nvarchar(100) NOT NULL, 
        VARIANT nvarchar(100) NOT NULL, PRIMARY KEY(VARIANT));`; 
        connection.query(query, function(err, rows, fields) {
          if (err){
             //console.log(err);
          }
          var query = `
          CREATE TABLE IF NOT EXISTS STATISTICS (
          ID INT unsigned NOT NULL AUTO_INCREMENT,
          RUNNER_ID INT UNSIGNED NOT NULL,
          ENTRY_DATE DATETIME NOT NULL,
          POINTS DECIMAL(5,2),
          PLACE DECIMAL(5,0),
          PRIMARY KEY(ID));
          `;
          connection.query(query, function(err, rows, fields) {
            if (err){
              //console.log(err);
            }
            callback();
          });
        });
      });
    });
  });
}

function createDB(connection, callback){
   connection.query('CREATE DATABASE IF NOT EXISTS ORIENTEERING;', function(err, rows, fields) {
    if (!err){
      ////console.log('DB ORIENTEERING CREATED');
      callback();
    }else{
      
      //console.log(err);
    }
      
  }); 
}

function switchToDB(connection, callback){
  connection.query('use ORIENTEERING;', function(err, rows, fields) {
    if (!err){
      callback();
    }
  });
}

//with duplicates save
function addNewRunner(runner, points, callback){
  
  if(!runner.active){
    var query = 'INSERT INTO RUNNERS (FULLNAME, BIRTH_DATE, TEAM, SEX, ACTIVE, CREATED_DATE, UPDATED_DATE) '
    + 'VALUES('
    +'"'+ runner.fullName+'",' 
    +'"'+ runner.birthDate+'",'
    +'"'+ runner.team+'",'
    +'"'+ runner.sex+'",'
    +'"'+ 1 +'",'
    +' NOW(), '
    +' NOW() '
    +');';
    //console.log(query);
    connection.query(query, function(err, rows, fields) {
      if(err){
        console.log(err. query);
      }
      var runnerID = rows.insertId;
      var date = new Date(runner.date);
      setDefaultPoints(runnerID, date, points).then(function(){
        callback(null, runnerID);
      });
     
    });
  }else{
    var runnerID = runner.id;
    var date = new Date(runner.date);
    setDefaultPoints(runnerID, date, points).then(function(){
      callback(null, runnerID);
    });
  }
  
}

function setDefaultPoints (runnerID, date, points){
  return new Promise(function(resolve, reject){
    var query = 'INSERT INTO RESULTS '
    +'(COMPETITION, RUNNER, DATE, POINTS, CREATED_DATE) '
    + 'VALUES ';
    
    for(var j=1; j<=globalSettings.startsAmount; j++){
      
      var targDate = new Date(date);
      targDate.setMonth(targDate.getMonth()-j);
      ////console.log(targDate);
      query += '(' 
      + 0 + ', ' 
      + runnerID + ', ' //+ '"'+date.toMysqlFormat() +'"'+ ', '
      + "'" + targDate.toMysqlFormat()   +"'"+ ', ' 
      +  points + ', '
      + 'NOW()'
      + ')';
      
      if(j!= globalSettings.startsAmount){
        query = query+ ',';
      }
    }
    query = query + ';';
    ////console.log(query);
    connection.query(query, function(err, rows, fields) {
      ////console.log(query);
      if (!err){
        var query = 'UPDATE RUNNERS SET ACTIVE = 1, UPDATED_DATE = NOW() WHERE ID = '+ runnerID + ';';
        connection.query(query, function(err, rows, fields) {
          //console.log(query);
          if(!err){
            resolve();
          }else{
            reject(err);
          }
        });
      }else{
        console.log(query);
        reject(err);
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
        callback(null, rows[0].MAIN);
      }
    }else{
      callback(err, runnerName);
    }
  });
}

function updateRunnersDetails(runners, callback){
  if(runners.length === 0){
    callback();
    return;
  }
  
  var query =`
  UPDATE RUNNERS
  SET 
   BIRTH_DATE = IF(LENGTH('${runners[0].birthDate}') > 0 AND LENGTH(BIRTH_DATE) = 0, '${runners[0].birthDate}', BIRTH_DATE),
   TEAM = IF(LENGTH('${runners[0].team}') > 0, '${runners[0].team}', TEAM),
   SEX = IF(SEX = 'M'  AND '${runners[0].sex}' = 'W', 'W', SEX),
   UPDATED_DATE = NOW()
   WHERE ID = ${runners[0].id} AND LOCK_DATA = 0;
  `;
  runners.shift();
  connection.query(query, function(err, rows, fields) {
    if (err){
      console.log(err);
    }
    updateRunnersDetails(runners, callback);
    
  });
}

