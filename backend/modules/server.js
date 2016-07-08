var express = require('express'),
    http = require('http'),
    morgan = require('morgan'),
    bodyParser = require('body-parser');


this.serverSettings = {
    hostname : '0.0.0.0'
};

var hostname = this.serverSettings.hostname || process.env.IP || process.env.OPENSHIFT_NODEJS_IP  || 'localhost';
var port = this.serverSettings.port || process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT ||  3000;



var app = express();
app.use(morgan('dev'));
app.use(express.static(__dirname + "./../../dist"));
app.use(bodyParser.json());


app.get('/', function(req, res){
    //res.send('Hello World!');
    res.sendFile(__dirname + './../../dist/index.html');
  //res.sendFile(__dirname + '/../dist/index.html');
});

/*
app.get('/dishes', function(req, res){
    res.end(getRespondData('dishes'));
});

app.get('/dishes/:id', function(req, res){
    res.end(getRespondData('dishes', req.params.id));
});

app.get('/promotions/:id', function(req, res){
    res.end(getRespondData('promotions', req.params.id));
});

app.get('/leadership', function(req, res){
    res.end(getRespondData('leadership'));
});

app.get('/leadership/:id', function(req, res){
    res.end(getRespondData('leadership', req.params.id));
});

app.put('/dishes/:id', function(req, res){
    console.log(req.body.comments);
    updateComments(req.body);
    res.end('sucess');
});

app.put('/feedback', function(req, res){
    updateFeedback(req.body);
    res.end('sucess');
});

app.get('/aboutus', function(req, res){
    res.end(getRespondData('leadership'));
});


function getRespondData(param, id){
  
  if(arguments.length > 1){
    return JSON.stringify(db[param][id]);
  }else{
    return JSON.stringify(db[param])
  }
};


function updateComments(data){
  var id = data.id;
  db.dishes[id].comments = data.comments;
}

function updateFeedback(data){
  console.log(data);
  db.feedback.push(data);
  console.log(db.feedback);
}*/


module.exports.startServer = function(){
    app.listen(port, hostname, function(){
        console.log('server running at http://'+hostname+":"+port+"/");
    });
};





