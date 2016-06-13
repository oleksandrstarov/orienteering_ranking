//'mongod' --bind_ip=$IP --dbpath=data --nojournal --repair

var dbClient = require('mongodb').MongoClient,
    assert = require('assert');
    
var url = 'mongodb://localhost:27017/database';

console.log(url);
console.log(process.env.IP);

module.exports.getCompetitionsIDs = function(callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        var collection = db.collection('competitions');
        collection.distinct("id", function(error, array){
            assert.equal(error, null);
            db.close();
            callback(array);
            
        });
    });
};


module.exports.getCompetitions = function(param, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        var collection = db.collection('competitions');
        
        collection.find(param).toArray(function(error, docs){
            assert.equal(error, null);
            callback(error, docs);
            db.close();
        });
        
    });
};


module.exports.addCompetition = function(data, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        var collection = db.collection('competitions');
        collection.insert(data);
        assert.equal(error, null);
        db.close();
        callback();
    });
};

module.exports.getPersonData = function(userID, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        
        var collection = db.collection('runners');
        collection.find(userID).toArray(function(error, docs){
            assert.equal(error, null);
            callback(error, docs);
            db.close();
        });
    });
};

module.exports.addPerson = function(data, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        var collection = db.collection('runners');
        collection.insert(data);
        assert.equal(error, null);
        db.close();
        callback();
    });
};


module.exports.updatePerson = function(data, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        var collection = db.collection('runners');
        var param = data.runnerID;
        var updatedData = data.content;
        
        
        collection.updateOne(param, updatedData, {upsert:false}, function(error, count, status){
            assert.equal(error, null);
            console.log(count + " " + status);
            db.close();
            callback(count);
        });
    });
};

/*db.students.update(
   { name: "joe" },
   { $push: { scores: { $each: [ 90, 92, 85 ] } } }
)
*/





/*
module.exports.findDocuments = function(path, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        console.log('connected');
        
        var collection = db.collection('folders');
        var param = {}
        if(path !== null){
            param = {path: path};
        }
        
        collection.find(param).toArray(function(error, docs){
            assert.equal(error, null);
            callback(docs);
            db.close();
        });
    });
};


module.exports.saveDocumentHandler = function(document, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        var path = document.path;
        var comment = document.comment;
        var user = document.user;
        var collection = db.collection('folders');
        console.log(document);
        if(comment!== ''){
            collection.updateOne({path:path, user:user}, {path: path, comment:comment, user:user}, {upsert:true}, function(error, count, status){
                assert.equal(error, null);
                console.log(count + " " + status);
                db.close();
                callback(count);
            });
        }else{
            collection.deleteOne({path:path, user:user}, function(error,result){
                console.log(result);
                assert.equal(error, null);
                db.close();
                callback(result);
            });
        }

    });
};


module.exports.checkLogin = function(userData, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        var userName = userData.userName;
        var password = userData.password;
        
        var collection = db.collection('users');
        var param = {
            userName: userName,
            password: password
        };
        
        collection.find(param).toArray(function(error, docs){
            assert.equal(error, null);
            if(docs.length > 0){
                callback({response: 'success', userName: userName});
            }else{
                callback({response: 'fail', event: 'login'});
            }
            db.close();
        });
        
        
    });
};

module.exports.registerUser = function(userData, callback){
    findUser(userData.userName, function(isExists){
        if(isExists){
            callback({response: 'fail',  event: 'registration'});
            return;
        }
        dbClient.connect(url, function(error, db){
            assert.equal(error, null);
            var userName = userData.userName;
            var password = userData.password;
            
            var param = {
                userName: userName,
                password: password
            };
            
            var collection = db.collection('users');
            collection.insertOne(param, function(error, result){
                assert.equal(error, null);
                console.log(result);
                callback({response: 'success', userName: userName});
                db.close();
            });
        });
    });
};


var findUser = function(userName, callback){
    dbClient.connect(url, function(error, db){
        assert.equal(error, null);
        
        var param = {
            userName: userName
        };
        
        var collection = db.collection('users');
        collection.find(param).toArray(function(error, docs){
            assert.equal(error, null);
            var isExists = false;
            if(docs.length > 0){
                isExists = true;
            }
            callback(isExists);
            db.close();
        });
            
        
    });
};
*/