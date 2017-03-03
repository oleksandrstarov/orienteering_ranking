'use strict';

//ENTRY POINT OF APPLICATION BACK END
// RUNS task
var server = require('./modules/server.js'),
    updater = require('./modules/dataUpdater.js'),
    cron = require('node-schedule'),
    db = require('./modules/dbUtils.js');




var now = new Date();
console.log('APPLICATION STARTED at : ' +now.getDate()+ "." +  (now.getMonth()+1)  + " - " +now.getHours() +":" +now.getMinutes());

var rule = new cron.RecurrenceRule();
rule.dayOfWeek = [6,0,1,2,3,4,5];
rule.hour = 23;
rule.minute = 40;
cron.scheduleJob(rule, function(){
    var now = new Date();
    console.log('AUTOUPDATE');
    //console.log('TEST');
    console.log('Day: ' + now.getDate() + " Hour: " +now.getHours());
    db.initDB(function(){
        db.updateRunnersPoints(null, function(){
            updater.updateData();
            
        });
    });
});

//manual start
db.initDB(function(){
     //db.updateRunnersPoints(null, function(){
            updater.updateData();
            server.startServer();
       // });
});




