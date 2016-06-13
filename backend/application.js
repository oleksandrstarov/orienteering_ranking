'use strict';

//ENTRY POINT OF APPLICATION BACK END
// RUNS task
var server = require('./modules/server.js'),
    updater = require('./modules/dataUpdater.js'),
    cron = require('node-schedule');


server.startServer();

var rule = new cron.RecurrenceRule();
rule.dayOfWeek = [6,0,1];
rule.hour = 3;
cron.scheduleJob(rule, function(){
    var now = new Date();
    console.log('This runs at 3:00AM every Saturday, Sunday and Monday.');
    console.log(now.getDate() + " " +now.getHours());
    updater.updateData();
});

updater.updateData();

