const express = require('express');
const app = express();
const http = require('http').Server(app);
//const fs = require('fs');
const path = require('path');

app.use('/js', express.static(path.join(__dirname, '/js')));

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, '/index.html'));
});

http.listen(3000, function(){
  console.log('frontend listening on *:3000');
});