/*
* 'require' is similar to import used in Java and Python. It brings in the libraries required to be used
* in this JS file.
* */

const express = require('express');
const upload = require('express-fileupload');
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { OAuth2Client, IdTokenClient } = require('google-auth-library');
const client = new OAuth2Client(IdTokenClient);
const bcrypt = require('bcryptjs');
const alertMessage = require('./helpers/messenger');
const generator = require('generate-password');
const { formatDate, radioCheck } = require('./helpers/hbs');
const moment = require('moment');


// for facebook create user 
// const urlParams = queryString.parse(window.location.search);
// const jwt = require('jsonwebtoken')

const flash = require('connect-flash');
const FlashMessenger = require('flash-messenger');

const MySQLStore = require('express-mysql-session');
const db = require('./config/db'); // db.js config file

const session = require('express-session')({
	key: 'tailornow_session',
	secret: 'tojiv',
	store: new MySQLStore({
		host: db.host,
		port: 3306,
		user: db.username,
		password: db.password,
		database: db.database,
		clearExpired: true,
		// How frequently expired sessions will be cleared; milliseconds:
		checkExpirationInterval: 9000000,
		// The maximum age of a valid session; milliseconds:
		expiration: 9000000,
	}),
	resave: false,
	saveUninitialized: false,
});
const sharedsession = require("express-socket.io-session");

/*
* Loads routes file main.js in routes directory. The main.js determines which function
* will be called based on the HTTP request and URL.
*/
const mainRoute = require('./routes/main');
const tailorRoute = require('./routes/tailor');
const custRoute = require('./routes/customer');
const riderRoute = require('./routes/rider');
// const pviewRoute = require('./routes/productview');

/*
* Creates an Express server - Express is a web application framework for creating web applications
* in Node JS.
*/
const app = express();
const http = require("http").createServer(app);

// Handlebars Middleware
app.engine('handlebars', exphbs({
	helpers: {
		formatDate: formatDate,
		radioCheck: radioCheck,
	},
	defaultLayout: 'main' // Specify default template views/layout/main.handlebar 

}));
app.set('view engine', 'handlebars');


// Additional Handlebars features
const Handlebars = require('handlebars');
Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
	switch (operator) {
		case '==':
			return (v1 == v2) ? options.fn(this) : options.inverse(this);
		case '===':
			return (v1 === v2) ? options.fn(this) : options.inverse(this);
		case '!=':
			return (v1 != v2) ? options.fn(this) : options.inverse(this);
		case '!==':
			return (v1 !== v2) ? options.fn(this) : options.inverse(this);
		case '<':
			return (v1 < v2) ? options.fn(this) : options.inverse(this);
		case '<=':
			return (v1 <= v2) ? options.fn(this) : options.inverse(this);
		case '>':
			return (v1 > v2) ? options.fn(this) : options.inverse(this);
		case '>=':
			return (v1 >= v2) ? options.fn(this) : options.inverse(this);
		case '&&':
			return (v1 && v2) ? options.fn(this) : options.inverse(this);
		case '||':
			return (v1 || v2) ? options.fn(this) : options.inverse(this);
		default:
			return options.inverse(this);
	}
});

Handlebars.registerHelper('eq', function () {
	const args = Array.prototype.slice.call(arguments, 0, -1);
	return args.every(function (expression) {
		return args[0] === expression;
	});
});

// For loop
Handlebars.registerHelper('times', function (n, block) {
	var accum = '';
	for (var i = 0; i < n; ++i)
		accum += block.fn(i);
	return accum;
});

Handlebars.registerHelper('minusStars', function (n, block) {
	var accum = '';
	if (n % 1 == 0){
		for (var i = 0; i < 5 - n; ++i)
			accum += block.fn(i);
	}
	else {
		for (var i = 0; i < 4 - n; ++i)
			accum += block.fn(i);
	}
	
	return accum;
});

Handlebars.registerHelper('money2dp', function (distance) {
	return parseFloat(distance).toFixed(2);
});

Handlebars.registerHelper("calculatedisc", function (price, discount) {
	var a = price * (1 - (discount / 100));
	return a.toFixed(2);
});

Handlebars.registerHelper("link", function (data) {
	return new Handlebars.SafeString("<a href='" + data.hash.url + data.hash.id + "'>" + data.hash.text + "</a>");
});

Handlebars.registerHelper('getToday', function () {
	return getToday();
});

Handlebars.registerHelper("pageInc", function (page) {
	return page + 1;
});
Handlebars.registerHelper('checklength', function (v1, v2, options) {
	'use strict';
	   if (v1.length>v2) {
		 return options.fn(this);
	  }
	  return options.inverse(this);
});

Handlebars.registerHelper('subString', function(passedString) {
    var theString = passedString.substring(0,70);
    return new Handlebars.SafeString(theString)
});

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

var paginate = require('handlebars-paginate');
Handlebars.registerHelper('paginate', paginate);

Handlebars.registerHelper ("setChecked", function (value, currentValue) {
	if (typeof value == "object"){
		if (value.includes(currentValue)){
			return "checked";
		}
		else {
			return "";
		}
	}
	else if (typeof value == "string"){
		if ( value == currentValue ) {
			return "checked";
		 } else {
			return "";
		 }
	}
	else{
		return "";
	}
})

Handlebars.registerHelper ("setDropdownlist", function (value, currentValue) {
	if ( value == currentValue ) {
		return "selected";
	} else {
		return "";
	}
	
})

// Handlebars.registerHelper('ifIncludes', function (location,path) {
// 	debugger
// 	console.log(location);
// 	if (location.includes(path))
// 		return true;
// 	return false
// });

app.use(upload());

// Body parser middleware to parse HTTP body in order to read HTTP data
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

// Creates static folder for publicly accessible HTML, CSS and Javascript files
app.use(express.static(path.join(__dirname, '/public')));

// Method override middleware to use other HTTP methods such as PUT and DELETE
app.use(methodOverride('_method'));

// Enables session to be stored using browser's Cookie ID
app.use(cookieParser());
// app.use(passport.authenticate('RememberMe'));

// To store session information. By default it is stored as a cookie on browser
// so the cookie works here alrdy so how shld i "deactivate" it LOLOLOLOLOLOL 
app.use(session);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(FlashMessenger.middleware);

// Place to define global variables
app.use(function (req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	// User Details
	if (typeof req.user != "undefined") {
		res.locals.user = req.user.dataValues || null;
	}
	//session
	if (typeof req.sess != "undefined") {
		res.locals.sess = req.sess.dataValues || null;
	}
	// Navbar
	if (req.path.includes('/customer')) {
		res.locals.useracctype = 'Customer';
	}
	else if (req.path.includes('/rider')) {
		res.locals.useracctype = 'Rider';
	}
	else if (req.path.includes('/tailor')) {
		res.locals.useracctype = 'Tailor';
	}

	if (req.session.myCart && req.session.myCart.length > 0){
		console.log("session got stuff");
		res.locals.cartTotalQuantity = req.session.myCart.length;
	}
	else {
		//console.log("none");
		res.locals.cartTotalQuantity = 0;
	}
	next();
});

app.use(async function (req, res, next){
	if(typeof req.user != "undefined") {
		try {
			let noti = await Notification.findAll({
				//limit: 3,
				where: { recipient: req.user.dataValues.username },
				order: [['id', 'DESC']],
				raw: true
			});
			if (req.path.includes('/notification')) { //if current page is notification
				res.locals.notifications = noti;
			}
			else{
				const slicedNoti = noti.slice(0, 3);
				res.locals.notifications = slicedNoti;
			}	

			// Count Unread Notifications
			var unreadnoti = 0;
			for (var i=0; i<noti.length; i++){
				if(noti[i].status == "Unread"){
					unreadnoti++;
				}
			}
			res.locals.unreadNoti = unreadnoti;
		}
		catch(err) {
			console.log(err.message);
		}
	}
	next();
});

app.use(methodOverride('_method'));
app.use(express.json())
// app.use(express.urlencoded({ extended: false }))
// app.set('view engine', 'ejs')

// Bring in database connection
const tailornowDB = require('./config/DBConnection');
const { getDefaultSettings } = require('http2');
// Connects to MySQL database
tailornowDB.setUpDB(false); // To set up database with new tables set (true)

const authenticate = require('./config/passport');
const User = require('./models/User');
// const { profile } = require('console');
authenticate.localStrategy(passport);
// Use Routes
/*
* Defines that any root URL with '/' that Node JS receives request from, for eg. http://localhost:5000/, will be handled by
* mainRoute which was defined earlier to point to routes/main.js
* */
app.use('/', mainRoute); // mainRoute is declared to point to routes/main.js
app.use('/tailor', tailorRoute);
app.use('/customer', custRoute);
app.use('/rider', riderRoute);

// Create socket instance
const io = require('socket.io')(http);
var users = [];

const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Notification = require('./models/Notifications');

function getToday(){
	// Get Date
	var currentdate = new Date(); 
	const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
	var datetime = currentdate.getDate() + " "
			+ monthNames[currentdate.getMonth()]  + " " 
			+ currentdate.getFullYear() + " "  
			+ currentdate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
	return datetime;
}

function getKeyByValue(object, value) {
	return Object.keys(object).find(key => object[key] === value);
}

io.use(sharedsession(session));
// add listener for new connection
io.eio.pingTimeout = 60000;
io.on("connection", function(socket){
	console.log("'\x1b[36m%s\x1b[0m'", "user connected: ", socket.id);
	var currentuser = socket.handshake.session.username;
	// console.log(users);
	users[currentuser] = socket.id;	
	io.sockets.emit("update_userCN", currentuser);

	socket.on('disconnect', () => {
		console.log("\x1b[31m", 'user disconnected: ', socket.id);
		usernameDC = getKeyByValue(users, socket.id);
		delete users[usernameDC];
		console.log(users);
		io.sockets.emit("update_userDC", usernameDC);
		// if (attempt === max_socket_reconnects) {
		// 	setTimeout(function(){ socket.socket.reconnect(); }, 5000);
		// 	return console.log("Failed to reconnect. Lets try that again in 5 seconds.");
		//   }
	});

	socket.on("check_status", function(data){
		// send event to receiver
		if (data.recipient in users){
			io.to(users[data.sender]).emit("update_userCN", data.recipient);	
		}
	});

	// if both archive -> send msg 
	socket.on("send_message", function(data){
		// send event to receiver
		var socketId = users[data.receiver];

		var datetime = getToday();
		data["timestamp"] = datetime;
		data["sender"] = currentuser;
		io.to(socketId).emit("new_message", data);

		// Save in db
		Message.create({
			sentby: currentuser,
			timestamp: datetime,
			message: data.message,
			chatId: data.chatid
		}).catch(err => {
			console.error('Unable to connect to the database:', err);
		});

		Chat.findOne({
			where: { id: data.chatid },
			raw: true
		})
		.then((chat) => {
			if(chat.sender == currentuser){
				Chat.update({
					senderstatus: "Read",
					recipientstatus: "Unread" 
				}, {
					where: { id: data.chatid }
				})
				.catch(err => console.log(err));
			}
			else{
				Chat.update({
					recipientstatus: "Read",
					senderstatus: "Unread"
				}, {
					where: { id: data.chatid }
				})
				.catch(err => console.log(err));
			}

		})
		.catch(err => console.log(err));
	});

	socket.on("send_upload", function(data){
		// send event to receiver
		data["sender"] = currentuser;
		var socketId = users[data.receiver];

		io.to(socketId).emit("new_upload", data);
	});


	////// Notifications IO handling ///////
	// Mark all notifications under user as read
	socket.on("markAsRead_noti", function(username){
		Notification.update({
			status: "Read"
		}, {
			where: {
				recipient: username
			}
		}).then(() => {
			console.log("markasread done");
		})
		.catch(err => console.log(err));
	});
});

global.start_newchat = function(data){ 
	var socketId = users[data.receiver];
	data.timestamp = getToday();
	io.to(socketId).emit("start_newchat", data);
};

global.send_notification = function(recipient, category, message, hyperlink){ 
	// Create object to send to client side
	console.log("send send");

	Notification.create({
		hyperlink: hyperlink,
		category: category,
		message: message,
		recipient: recipient,
		status: "Unread",
		time: getToday()
	}).then((noti) =>{
		var data = {
			"id": noti.dataValues.id,
			"recipient": recipient,
			"category": category,
			"message": message,
			"hyperlink": hyperlink,
			"timestamp": getToday()
		}
		setTimeout(function(){ 
			var socketId = users[recipient];
			console.log(users);
			console.log(socketId);
			io.to(socketId).emit("send_notification", data);
		}, 2000);
	})
	.catch(err => {
		console.error('Unable to connect to the database:', err);
	});
};

// google login
passport.use(new GoogleStrategy({
	clientID: '601670228405-m3un3mco0q1q9faa22ho21e1g5abtd1j.apps.googleusercontent.com',
	clientSecret: 'LB_jS4hb3y_jYxTWnKAhr0P8',
	callbackURL: "http://localhost:5000/auth/google/homecust"
},
	function (accessToken, refreshToken, profile, cb) {
		User.findOne({ where: { username: profile.id, google_id: profile.id, usertype: 'customer' } })
			.then(Customer => {
				if (Customer) {
					cb(null, Customer);
				}
				else {
					console.log(profile);
					let firstname = profile.displayName.split(' ')[0];
					let lastname = profile.displayName.split(' ')[1];
					var password = generator.generate({
						length: 10,
						numbers: true
					});
					// console.log('passsssssworrrdddd',password);
					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(password, salt, (err, hash) => {
							if (err) throw err;
							password = hash;
							User.create({ username: profile.id, firstname: firstname, lastname: lastname, google_id: profile.id, usertype: 'customer', password: password })
								.then(user => {
									cb(null, user);
								})
								.catch(err => console.log(err));
						})
					});
				}
			});
	}
));

app.get("/auth/google", passport.authenticate("google", { scope: ['profile'] }));


app.get("/auth/google/homecust", passport.authenticate("google", { failureRedirect: "/customer/custlogin" }),
	function (req, res) {
		res.redirect('/customer/homecust')
	}
)

// facebook login
passport.use(new FacebookStrategy({
	clientID: '3000022716989207',
	clientSecret: 'e3883b73cf1392784301194f05963827',
	callbackURL: "http://localhost:5000/auth/facebook/homecust"
},
	function (accessToken, refreshToken, profile, done) {
		console.log('facebook-->', profile);

		User.findOne({ where: { facebook_id: profile.id, usertype: 'customer' } })
			.then(Customer => {
				if (Customer) {
					done(null, Customer);
				}
				else {
					let firstname = profile.displayName.split(' ')[0];
					let lastname = profile.displayName.split(' ')[1];
					var password = generator.generate({
						length: 10,
						numbers: true
					});
					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(password, salt, (err, hash) => {
							if (err) throw err;
							password = hash;
							User.create({ username: profile.id, firstname: firstname, lastname: lastname, facebook_id: profile.id, usertype: 'customer', password: password })
								.then(user => {
									// alertMessage(res, 'success', user.username + ' Please proceed to login', 'fas fa-sign-in-alt', true);
									// res.redirect('customer/homecust');
									done(null, user);
								})
								.catch(err => console.log(err));
						})
					});
				}
			});
	}
));

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/homecust',
	passport.authenticate('facebook', {
		// successRedirect: '/customer/homecust',
		failureRedirect: '/customer/custlogin'
	}),
	function (req, res) {
		res.redirect('/customer/homecust')
	}
);

app.get('/test', (req, res) => {
	res.render('testchat', { title: "Test Chat" });
});

// This route maps the root URL to any path defined in main.js

// Handle 404 error page - Keep this as a last route
app.use(function (req, res, next) {
	res.status(404);
	res.render('404');
});
// No routes below this, otherwise it will get overwritten.

/*
* Creates a unknown port 5000 for express server since we don't want our app to clash with well known
* ports such as 80 or 8080.
* */
const port = 5000;

http.listen(port, () => {
	console.log('\x1b[36m%s\x1b[0m', `JIAYOUS, IT WILL ALL WORK OUT SOME DAY! Server started on port ${port}.`);
})
