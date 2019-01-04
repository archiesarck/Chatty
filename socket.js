var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendfile('homepage.html');
});

var room = 1;
io.on('connection', function(socket){
	
	if(io.nsps['/'].adapter.rooms["room-"+room] && io.nsps['/'].adapter.rooms["room-"+room].length > 2) room++;
	socket.join("room-"+room);
	io.sockets.in("room-"+room).emit('r', 'Room number '+ room);

	socket.on('disconnect', function(){
		socket.leave("room-"+room);
		io.sockets.in("room-"+room).emit('r', 'Room number '+ room);
	});
});

http.listen(80, function(){
	// console.log('Listening on *:80');
});