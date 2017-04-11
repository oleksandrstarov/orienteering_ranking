'use strict';

//ENTRY POINT OF APPLICATION BACK END
// RUNS task
var utils = require('./modules/utils.js'),
    server = require('./modules/server.js'),
    updater = require('./modules/dataUpdater.js'),
    cron = require('node-schedule'),
    db = require('./modules/dbUtils.js');




var now = new Date();
console.log('APPLICATION STARTED at : ' +now.getDate()+ "." +  (now.getMonth()+1)  + " - " +now.getHours() +":" +now.getMinutes());

var x = new Date();
var currentTimeZone = -x.getTimezoneOffset()/60;
var timeshiftFromKharkiv = currentTimeZone - x.getTimeShift();
var requiredHour = 23;
var timeToStart = requiredHour + timeshiftFromKharkiv;
console.log(timeToStart);



var rule = new cron.RecurrenceRule();
rule.dayOfWeek = [0];
rule.hour = timeToStart;
rule.minute = 30;
cron.scheduleJob(rule, function(){
    var now = new Date();
    console.log('AUTOUPDATE (local server time)');
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




