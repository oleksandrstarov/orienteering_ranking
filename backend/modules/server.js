var express = require('express'),
    morgan = require('morgan'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    path = require('path'),
    db = require('./dbUtils.js'),
    dataUpdater = require('./dataUpdater.js');


this.serverSettings = {
    hostname : '0.0.0.0'
};

var hostname = process.env.OPENSHIFT_NODEJS_IP  || this.serverSettings.hostname || process.env.IP || 'localhost';
var port = process.env.OPENSHIFT_NODEJS_PORT || this.serverSettings.port || process.env.PORT || 3000;

var app = express();
app.use(session({
    secret: '2C41-4D24-WppQ38S',
    resave: true,
    saveUninitialized: true
}))
app.use(morgan('dev'));
app.use(express.static(__dirname + "./../../dist"));
app.use(bodyParser.json());

var auth = function(req, res, next) {
  if (!process.env.OPENSHIFT_NODEJS_IP || req.session && req.session.user === "admin01" && req.session.admin){
    return next();  
  }else{
   return res.sendStatus(401);  
  }
};

app.get('/runners', function(req, res){
    db.getRunnersList(function(error, data){
        res.end(data);
    });
});

app.get('/runners/:id', function(req, res){
    db.getRunnerResults(req.params.id, function(error, data){
         res.end(data);
    });
});

app.get('/competitions', function(req, res){
    db.getCompetitionsList(function(error, data){
         res.end(data);
    });
});

app.get('/competitions/:id', function(req, res){
    db.getCompetitionResults(req.params.id, function(error, data){
         res.end(data);
    });
});


app.get('/stats', function(req, res){
    db.getStatistics().then(function(stats){
        res.end(JSON.stringify({stats:stats}));
    }, function(error){
        res.end(JSON.stringify({error:error}));
    });
});


app.get('/about', function(req, res){
    res.end(JSON.stringify(db.getGroupSettings()));
});


/////////////////////////////////////////////Admin///////////////////////////////////////////////

app.put('/admin/runners/merge',auth, function(req, res){
    dataUpdater.mergeDuplicates(req.body, function(error){
        db.getRunnersList(function(err, data){
             res.end(JSON.stringify({error:error+err, data:data}));
        });
    });
});

app.put('/admin/runners/update',auth, function(req, res){
    db.updateRunnerDetails(req.body.data, function(error){
        res.end(JSON.stringify({error:error}));
    });
});

app.put('/admin/competitions/addCompetition',auth, function(req, res){
    dataUpdater.manualImport(req.body.data, function(error){
        if(error){
            res.end(JSON.stringify({error:error}));
        }else{
             db.getCompetitionsList(function(error, data){
                 res.end(JSON.stringify({data:data, error:null}));
            });
        }
    });
});

app.put('/admin/competitions/updateCompetitionDetails',auth, function(req, res){
    db.updateCompetition(req.body.data, function(error){
        res.end(JSON.stringify({data:error}));
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
    if(req.body.user === 'admin01' && req.body.password === '!Pass'){
        req.session.user = "admin01";
        req.session.admin = true;
        setTimeout(function(){
            req.session.destroy();
        }, 1800000); // 10 minutes
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





