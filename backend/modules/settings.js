'use strict';


var settings = {
    defaultPoints: 10,
    defaultTime: 60,
    maxPoints: 90,
};



var sqlSettings = {
    host     :  process.env.IP,
    user     : 'oleksandrstarov',
    password : '',
    database : 'mysql'
};

var sqlSettingsOS = {
    host     :  process.env.OPENSHIFT_MYSQL_DB_HOST,
    user     : 'adminFL8Dm1m',
    password : '5wWNg1cqJ6y5',
    database : 'ranking'
};

//var isMaintanance = false;



module.exports.getSettings =function(){
    return settings;
};

module.exports.getSQLSettings =function(){
    if(process.env.OPENSHIFT_MYSQL_DB_HOST){
        return sqlSettingsOS;
    }
    return sqlSettings;
};



Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};

Date.prototype.addDays = function(days) {
    var result = new Date(this);
    result.setDate(result.getDate() + days);
    return result; 
};

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
};

String.prototype.normalizeTitle = function(){
   return this.replace(/\n/g, ' ')
   .replace(/\r/g, ' ')
   .replace(/ {2,}/g, ' ')
   .replace('Протокол результатов (промежуточные времена).', '')
   .replace('"', '')
   .replace("'", '')
   .replace('Протокол результатов.', '')
   .replace('ПРОТОКОЛ РЕЗУЛЬТАТОВ', '').trim();
   //.replace(/,?[, -]\d{2,}/, '');
};