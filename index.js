var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname+'/chat.html');
});

users = [];
io.sockets.on('connection', function(socket){
	console.log('A user connected!');
	socket.on('setUsername', function(data){
		
		if(users.indexOf(data) > -1){
			socket.emit('userExists', data + ' username is taken!');
		}
		else{
			users.push(data);
			socket.join(data);
			socket.emit('userSet', {user: data});
			io.sockets.emit('online', users);
		}
	});

	socket.on('msg', function(data){
		//console.log(data);
		var to = data.to;
		var message = data.message;
		var user = data.from;
		io.sockets.in(to).emit('newmsg', {message: message, from: user});
	});

	socket.on('disconnect', function(){
	});
});

http.listen(process.env.PORT || 80);