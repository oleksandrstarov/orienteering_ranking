'use strict';


var settings = {
    defaultPoints: 10,
    defaultTime: 75,
    maxPoints: 300,
};

var sqlSettings = {
    host     : process.env.IP,
    user     : 'oleksandrstarov',
    password : '',
    database : 'mysql'
};



module.exports.getSettings =function(){
    return settings;
};

module.exports.getSQLSettings =function(){
    return sqlSettings;
};



Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
};

String.prototype.normalizeTitle = function(){
   return this.replace(/ {2,}/g, ' ').replace(/,?[, -]\d{2,}.+/, '').replace(/\../, '');
};