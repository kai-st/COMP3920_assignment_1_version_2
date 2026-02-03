require('dotenv').config();
const express = require("express");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const database = require('./databaseConnection');
const db_table = require('./database/table');
const db_users = require('./database/users');
const db_confirm = require('./database/confirmConnection');
db_confirm.printMySQLVersion();

if (process.env.RESET == "reset") {
  db_table.reset_database();
}

const port = process.env.PORT || 3000;

const app = express();

const expireTime = 60 * 60 * 1000; // 1 hour

const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_db_name = process.env.SESSION_DB_NAME;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@cluster0.afjuq6i.mongodb.net/${mongodb_db_name}`,
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
  secret: node_session_secret,
	store: mongoStore,
	saveUninitialized: false, 
	resave: true
}
));

function createSession(req, username) {
  req.session.authenticated = true;
  req.session.username = username;
  req.session.cookie.maxAge = expireTime;
}

function destroySession(req, res) {
  	req.session.destroy();
		res.redirect('/');
}

function isValidSession(req) {
	if (req.session.authenticated && req.session.username) {
		return true;
	}
	return false;
}

app.get("/", (req, res) => {
  res.render("home", {username: isValidSession(req) ? req.session.username : null});
});

app.get("/signup", (req, res) => {
  let missing = req.query.missing;
  if (!missing) {
    missing = 0;
  }
  let dbError = req.query.error;
  if (!dbError) {
    dbError = 0;
  }
  res.render("signup", {missing: missing, error: dbError})
});

app.post("/signup", async (req, res) => {
  const username = req.body.username;
  if (!username) {
    res.redirect('/signup?missing=1');
  }
  const password = req.body.password;
  if (!password) {
    res.redirect('/signup?missing=2');
  }

  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  const success = await db_users.createUser({username, hashedPassword});

  if (success) {
    createSession(req, username);
    res.redirect("/members");
  } else {
    res.redirect("/signup?error=1");
  }
});

app.get("/login", (req, res) => {
  let missing = req.query.missing;
  if (!missing) {
    missing = 0;
  }
  let otherError = req.query.error;
  if (!otherError) {
    otherError = 0;
  }
  res.render("login", {missing: missing, error: otherError})
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  if (!username) {
    res.redirect('/login?missing=1');
  }
  const password = req.body.password;
  if (!password) {
    res.redirect('/login?missing=2');
  }

  const results = await db_users.getUser(username);

  if (results) {
      // if (results.length == 1) {
          if (bcrypt.compareSync(password, results[0].password)) {
              createSession(req, username);      
              res.redirect('/members');
              return;
          }
          else {
              console.log("invalid password");
          }
      // }
      // else {
      //     console.log('invalid number of users matched: '+results.length+" (expected 1).");
      //     res.redirect('/login?error=1');
      //     return;            
      // }
  }

  console.log('user not found');
  res.redirect("/login?error=2");
});

function sessionValidation(req, res, next) {
	if (!isValidSession(req)) {
		destroySession(req, res);
		return;
	}
	else {
		next();
	}
}

app.get("/members", sessionValidation, (req, res) => {
  const randomImage = Math.floor(Math.random() * 3 + 1);
  let imageSource;
  switch (randomImage) {
    case 1:
      imageSource = "/lemonlopes.jpg";
      break;
    case 2:
      imageSource = "/punk_hummingbird.jpg";
      break;
    default:
      imageSource = "/stegosaurus_says_moo.jpg";
      break;
  }
  res.render("members", {
    username: req.session.username, 
    imageSource: imageSource
  })
});

app.get("/logout", (req, res) => {
  destroySession(req, res);
});

app.use(express.static(__dirname + "/public"));

app.get("/*splat", (req, res) => {
  res.status(404).render("404");
});

app.listen(port, () => {
  console.log("App version 1 listening on port " + port);
});
