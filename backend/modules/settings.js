'use strict';


var settings = {
    //defaultPoints: 10,
    defaultTime: 60,
    maxPoints: 90,
    startsAmount:6
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

var groupSettings = [
    
    {name: 'M21E', variants:['М21Е', 'M21E', 'Ч21Е'], sex: 'M', shift: 6.01},
    
    {name: 'M21A', variants:['M21A', 'М21А', 'M21,', 'M21 ', 'Ч21 '], sex: 'M', shift: 16.39},
    
    {name: 'M20', variants:['М20', 'M20', 'Ч20'], sex: 'M', shift: 11.81},
    
    {name: 'M18', variants:['М18', 'M18', 'Ч18'], sex: 'M', shift: 16.39},
    
    {name: 'M16', variants:['М16', 'M16', 'Ч16'], sex: 'M', shift: 26.19},
    
    {name: 'M35', variants:['М35', 'M35', 'Ч35'], sex: 'M', shift: 14.09},
    
    {name: 'M40', variants:['М40', 'M40', 'Ч40'], sex: 'M', shift: 16.00},
    
    {name: 'M45', variants:['М45', 'M45', 'Ч45'], sex: 'M', shift: 18.21},
    
    {name: 'M50', variants:['М50', 'M50', 'Ч50'], sex: 'M', shift: 22.42},
    
    {name: 'M55', variants:['М55', 'M55', 'Ч55'], sex: 'M', shift: 27.69},
    
    {name: 'M60', variants:['М60', 'M60', 'Ч60'], sex: 'M', shift: 38.12},
    
    {name: 'M65', variants:['М65', 'M65', 'Ч65'], sex: 'M', shift: 47.93},
    
    //WWW
    {name: 'Ж21Е', variants:['Ж21Е', 'W21Е'], sex: 'W', shift: 6.52},
    
    {name: 'Ж21A', variants:['Ж21A', 'W21А', 'Ж21,', 'Ж21 '], sex: 'W', shift: 11.33},
    
    {name: 'Ж20', variants:['Ж20', 'W20'], sex: 'W', shift: 10.82},
    
    {name: 'Ж18', variants:['Ж18', 'W18'], sex: 'W', shift: 11.33},
    
    {name: 'Ж16', variants:['Ж16', 'W16'], sex: 'W', shift: 17.66},
    
    {name: 'Ж35', variants:['Ж35', 'W35'], sex: 'W', shift: 13.07},
    
    {name: 'Ж40', variants:['Ж40', 'W40'], sex: 'W', shift: 12.92},
    
    {name: 'Ж45', variants:['Ж45', 'W45'], sex: 'W', shift: 14.24},
    
    {name: 'Ж50', variants:['Ж50', 'W50'], sex: 'W', shift: 19.39},
    
    {name: 'Ж55', variants:['Ж55', 'W55'], sex: 'W', shift: 25.23},
    
    {name: 'Ж60', variants:['Ж60', 'W60'], sex: 'W', shift: 34.35},
    
    {name: 'Ж65', variants:['Ж65', 'W65'], sex: 'W', shift: 40.67}
];


//var isMaintanance = false;

module.exports.getGroupSettings =function(){
    return groupSettings;
};

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