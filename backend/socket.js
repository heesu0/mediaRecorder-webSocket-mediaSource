var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

io.on('connection', function (socket) {
  console.log('websocket connected');
  socket.on('blob', function (data) {
    socket.emit('return', data);
    console.log(data);
  });

  socket.on('disconnect', function () {
    console.log("socket disconnected!");
  });
});


http.listen(80, function () {
  console.log('backend listening on *:80');
});
