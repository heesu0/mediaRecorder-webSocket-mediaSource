var express = require('express');
var app = express();
var http = require('http').Server(app);
var fs = require('fs');

app.use(express.static('js'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
  console.log('frontend listening on *:3000');
});