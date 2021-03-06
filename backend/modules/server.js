var compression = require('compression'),
    express = require('express'),
    morgan = require('morgan'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    path = require('path'),
    db = require('./dbUtils.js'),
    dataUpdater = require('./dataUpdater.js');


this.serverSettings = {
    hostname : '0.0.0.0'
};

var serverProps= {
     cacheTime: 1200
};
var hostname = process.env.OPENSHIFT_NODEJS_IP  || this.serverSettings.hostname || process.env.IP || 'localhost';
var port = process.env.OPENSHIFT_NODEJS_PORT || this.serverSettings.port || process.env.PORT || 3000;

var app = express();
app.use(compression());
app.use(session({
    secret: '2C41-4D24-WppQ38S',
    resave: true,
    saveUninitialized: true
}));
morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
});
app.use(morgan('combined'));
app.use(express.static(__dirname + "./../../dist"));
app.use(bodyParser.json());

var auth = function(req, res, next) {
  if (!process.env.OPENSHIFT_NODEJS_IP || req.session && req.session.user === "admin01" && req.session.admin){
    return next();  
  }else{
    return res.sendStatus(401);  
  }
};
var recalculating = dataUpdater.isUpdating;

app.use(function (req, res, next) {
  if(recalculating()){
    res.sendStatus(434);
    return;   
  }
  next();
});

app.get('/runners', function(req, res){
    var runners =  JSON.stringify(db.getDataFromCache('runners'));
    res.setHeader('Cache-Control', `public, max-age=${serverProps.cacheTime}`);
    res.end(runners);
});

app.get('/runners/:id', function(req, res){
    res.setHeader('Cache-Control', `public, max-age=${serverProps.cacheTime}`);
    db.getRunnerResults(req.params.id, function(error, data){
         res.end(data);
    });
});

app.get('/runner/:id/:compare', function(req, res){
    db.getComparableData(req.params.id, req.params.compare)
    .then(function(data){
        res.setHeader('Cache-Control', `public, max-age=${serverProps.cacheTime}`);
        res.end(JSON.stringify(data));
    })
    .catch(function(error){
        console.log(error);
        res.end();
    })
});

app.get('/competitions', function(req, res){
    var competitions =  JSON.stringify(db.getDataFromCache('competitions'));
    res.setHeader('Cache-Control', `public, max-age=${serverProps.cacheTime}`);
    res.end(competitions);
});

app.get('/competitions/:id', function(req, res){
    db.getCompetitionResults(req.params.id, function(error, data){
         res.setHeader('Cache-Control', `public, max-age=${serverProps.cacheTime}`);
         res.end(data);
    });
});


app.get('/stats', function(req, res){
    var statistics =  JSON.stringify({stats:db.getDataFromCache('statistics')});
    res.setHeader('Cache-Control', `public, max-age=${serverProps.cacheTime}`);
    res.end(statistics);
});


app.get('/about', function(req, res){
    res.setHeader('Cache-Control', `public, max-age=${serverProps.cacheTime}`);
    res.end(JSON.stringify(db.getGroupSettings()));
});


/////////////////////////////////////////////Admin///////////////////////////////////////////////

app.put('/admin/runners/merge',auth, function(req, res){
    dataUpdater.mergeDuplicates(req.body, function(error){
        db.fillCache(function(){
            db.getRunnersList(function(err, data){
                res.end(JSON.stringify({error:error+err, data:data}));
            });
        })
       
    });
});

app.put('/admin/runners/update',auth, function(req, res){
    db.updateRunnerDetails(req.body.data, function(error){
        db.fillCache(function(){
            res.end(JSON.stringify({error:error}));
        });
    });
});

app.put('/admin/competitions/addCompetition',auth, function(req, res){
    dataUpdater.manualImport(req.body.data, function(error){
        db.fillCache(function(){
            if(error){
                res.end(JSON.stringify({error:error}));
            }else{
                 db.getCompetitionsList(function(error, data){
                     res.end(JSON.stringify({data:data, error:null}));
                });
            }
        });
    });
});

app.put('/admin/competitions/updateCompetitionDetails',auth, function(req, res){
    db.updateCompetition(req.body.data, function(error){
        db.fillCache(function(){
            res.end(JSON.stringify({data:error}));
        });
    });
});

app.put('/admin/competitions/recalculate',auth, function(req, res){
    dataUpdater.recalculateCompetitions(req.body.data, function(error){
        if(error){
            res.end(JSON.stringify({error:error}));
        }else{
             db.getCompetitionsList(function(error, data){
                res.end(JSON.stringify({data:data, error:null}));
            });
        }
    });
});

app.put('/admin/competitions/drop',auth, function(req, res){
    dataUpdater.dropData(function(error){
        if(error){
            res.end(JSON.stringify({error:error}));
        }
    });
});

app.get('/admin/runners',auth, function(req, res){
    db.getRunnersList(function(error, data){
         res.end(data);
    });
});

app.get('/admin/competitions',auth, function(req, res){
    db.getCompetitionsList(function(error, data){
         res.end(data);
    });
});

app.put('/adminLogin', function(req, res){
    if(req.body.user === 'admin01' && req.body.password.getHashCode() === 32956370){
        req.session.user = "admin01";
        req.session.admin = true;
        setTimeout(function(){
            req.session.destroy();
        }, 1800000); // 30 minutes
        res.end(JSON.stringify({adminPanel:'app.adminCompetitions'}));
    }
    res.end(JSON.stringify({error:'invalid password'}));
});

app.get('*', function(req, res){
    res.status(404).sendFile(path.resolve(__dirname + "./../../dist/404.html"));
});

module.exports.startServer = function(){
    app.listen(port, hostname, function(){
        console.log('server running at http://'+hostname+":"+port+"/");
    });
};





