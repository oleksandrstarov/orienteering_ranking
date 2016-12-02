'use strict';

//ENTRY POINT OF APPLICATION BACK END
// RUNS task
var server = require('./modules/server.js'),
    updater = require('./modules/dataUpdater.js'),
    cron = require('node-schedule'),
    db = require('./modules/dbUtils.js');




var now = new Date();
    //console.log('This runs at 3:00AM every Saturday, Sunday and Monday.');
    console.log('APPLICATION STARTED at');
    console.log(now.getDate()+ "." +  1 +now.getMonth()  + " - " +now.getHours() +":" +now.getMinutes());

var rule = new cron.RecurrenceRule();
rule.dayOfWeek = [6,0,1];
rule.hour = 3;
rule.minute = 0;
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


db.initDB(function(){
     //db.updateRunnersPoints(null, function(){
            updater.updateData();
            server.startServer();
       // });
});




