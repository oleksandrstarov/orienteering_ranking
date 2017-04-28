"use strict";

var cacheObject = {};
module.exports.setData = function(prop, value){
    if(!prop){
        return;
    }
    cacheObject[prop] = value;
    setRunnersStats();
};



module.exports.getData = function(prop){
    if(!prop){
        return null;
    }
    return cacheObject[prop];    
};

function setRunnersStats(){
    if(!cacheObject['runners'] || !cacheObject['statistics']){
        return;
    }
    var places = cacheObject['runners'].map(function(item){
        if(item.PLACE_DIFF === null){
            return 0;
        }
        return item.PLACE_DIFF;
    });
    
   
    var max =  Math.max.apply(null, places);
    var min =  Math.min.apply(null, places);
  
    var progress = {up:[], down:[], novices:[]};
    
    
    cacheObject['runners'].forEach(function(item){
       if(item.PLACE_DIFF === null){
           progress.novices.push(item);
       }
       if(max && item.PLACE_DIFF == max){
           progress.up.push(item);
       }
       if(min && item.PLACE_DIFF == min){
           progress.down.push(item);
       }
    });
    
    cacheObject['statistics'].progress = progress;
}