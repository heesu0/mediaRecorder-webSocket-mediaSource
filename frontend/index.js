var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
  console.log('frontend listening on *:3000');
});