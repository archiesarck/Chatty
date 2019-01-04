var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var number = 0;
var session = require('express-session');
var cookieParser = require('cookie-parser');
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(upload.array());
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({ extended : true }));
app.use(cookieParser());
app.use(session({ secret : "mann" }));

app.engine('.html', require('ejs').__express);
app.set('views',__dirname+'/views');
app.set('view engine','html');

app.get('/', function(req, res){
	res.render('index');
});

app.get('/signup', function(req, res){
	res.render('signup');
});

const mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/user');
// mongoose.connection.once('open', function(){
// 	console.log('Connected');
// }).on('error', function(error){
// 	console.log('Error');
// });
var conn_user = mongoose.createConnection('mongodb://localhost/user');
var conn_msg = mongoose.createConnection('mongodb://localhost/messages');
// mongoose.connect('mongodb://localhost/messages');
// mongoose.connection.once('open', function(){
// 	console.log('Connected');
// }).on('error', function(error){
// 	console.log('Error');
// });

var userSchema = mongoose.Schema({
	name: String,
	uid: String,
	pwd: String
});

var msgSchema = mongoose.Schema({
	from_id: String,
	from_name: String,
	message: String,
	to: String
});

var Message = conn_msg.model('Message', msgSchema);
var User = conn_user.model('User', userSchema);

app.post('/signup', function(req, res){
	var user = req.body;
	if(!user.username || !user.user_pwd || !user.re_user_pwd){
		res.send('Incomplete information!');
	}
	else{
		if(user.user_pwd!=user.re_user_pwd){
			res.send('Passwords do not match!');
		}
		else{
			var newUser = new User({
				name: user.name,
				uid: user.username,
				pwd: user.user_pwd
			});
			newUser.save(function(err, user){
				if(err) res.send('Error!');
			});
			req.session.user = newUser;
			res.redirect('/homepage');
		}
	}
});

app.post('/signin', function(req, res){
	User.find({uid: req.body.username}, function(err, user){
		if(err) res.redirect('/index');
		else{
			if(user[0].pwd == req.body.user_pwd){
				//res.send('Welcome to the home page');
				req.session.user = user[0];
				number++;
				//console.log(req.session);
				res.redirect('/homepage');
			}
			else{
				res.send('Wrong Password!');
			}
		}
	});
});

app.get('/homepage', function(req, res){
	//console.log(req.session);
	res.render('chatpage',{id: req.session.user.uid, name: req.session.user.name});
});

var onscreen;
//console.log('herer');
io.sockets.on('connection', function(socket){
	//console.log('A user connected!');
	
	socket.on('i_am_on',function(data){
		socket.join(data);
		user_array = [];
		user_id_array = [];
		User.find({}, function(err, user_list){
			user_list.forEach(function(user){
				user_array.push(user.name);
				user_id_array.push(user.uid);
			});
			//console.log(user_array);
			onscreen = user_id_array[0];
			io.sockets.emit('checked',{ua: user_array, uia: user_id_array});
		});		
	});

	socket.on('onscreen_frd', function(data){
		onscreen = data.frd;
		msg_array = [];
		Message.find({ $or: [ { from_id: data.frd, to: data.me }, { from_id: data.me, to: data.frd } ]}, function(err, msgs){
			msgs.forEach(function(msg){
				msg_array.push(msg);
			});
			//console.log(msg_array);
			socket.emit('onscreen_chat', msg_array);
		});
		//console.log(data);
	});

	socket.on('message', function(data){
		//console.log(onscreen);
		io.sockets.in(data.t).emit('newMessage', {m: data.m, t: data.t, f: data.f});
		var newMessage = new Message({
			from_id: data.f.id,
			from_name: data.f.name,
			message: data.m,
			to: data.t
		});

		newMessage.save(function(err, msg){
			if(err) console.log('Error!');
		});
	});
});

app.post('/logout', function(req, res){
	req.session.destroy(function(){
		res.redirect('/');
	});
});

http.listen(80);