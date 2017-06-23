"use strict";


Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};

Date.prototype.getTimeShift = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset()?3:2;
};

Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};

Date.prototype.addDays = function(days) {
    console.log(this.toMysqlFormat());
    var result = new Date(this);
    result.setUTCDate(result.getUTCDate() + days);
    console.log(result.toMysqlFormat());
    return result; 
};

Date.prototype.withoutTime = function() {
    var d = new Date(this);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

Date.prototype.UTC = function() {
    return new Date(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate(), this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()); 
}

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

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

String.prototype.getHashCode = function(){
  return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
};