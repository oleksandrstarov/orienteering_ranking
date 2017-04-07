"use strict";

var cacheObject = {};
module.exports.setData = function(prop, value){
    if(!prop){
        return;
    }
    cacheObject[prop] = value;    
};

module.exports.getData = function(prop){
    if(!prop){
        return null;
    }
    return cacheObject[prop];    
};