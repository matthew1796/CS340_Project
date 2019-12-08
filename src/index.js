/**
 * Node.js Web Application Template
 * 
 * The code below serves as a starting point for anyone wanting to build a
 * website using Node.js, Express, Handlebars, and MySQL. You can also use
 * Forever to run your service as a background process.
 */
const express = require('express');
const exphbs = require('express-handlebars');

const session = require('express-session');

const mysql = require('mysql');
const path = require('path');
const bodyParser = require("body-parser");
const router = express.Router();

const app = express();

// Configure handlebars
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.hbs'
});

//Configure sessions
const options = {
  store: this.store, // Default is memoryStore, which is for dev only. Setup redis or memcached for prod
  secret: 'secret', // Required, used to sign session id cookie
  saveUninitialized: true, // Forces a session that is "uninitialized" to be saved to the store
  resave: false, //Forces the session to be saved back to the session store
  rolling: true //Force a session identifier cookie to be set on every response
};

const middleware = session(options);

// Configure the views
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(path.basename(__dirname), 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(middleware);

// Setup static content serving
app.use(express.static(path.join(path.basename(__dirname), 'public')));

/**
 * Create a database connection. This is our middleware function that will
 * initialize a new connection to our MySQL database on every request.
 */
const config = require('./config');
function connectDb(req, res, next) {
  console.log('Connecting to the database');
  let connection = mysql.createConnection(config);
  connection.connect();
  req.db = connection;
  console.log('Database connected');
  next();
}

/**
 * This is the handler for our main page. The middleware pipeline includes
 * our custom `connectDb()` function that creates our database connection and
 * exposes it as `req.db`.
 */
app.get('/', connectDb, function(req, res, next) {
  console.log('---Got request for the home page---');

  //info('Rendering all the products');
  req.db.query('SELECT P.productID, P.productName, P.description, C.price FROM Products P, Catalog C WHERE P.productID = C.productID ORDER BY C.numberOfEntries DESC LIMIT 3', function(
    err,
    products
  ) {
    if (err) return next(err);
    res.render('home', { products });
    close(req);
  });
});

app.get('/browse', connectDb, function(req, res) {
  console.log('Got request for the browse page');

  req.db.query('SELECT P.productID, P.productName, P.description, C.price FROM Products P, Catalog C WHERE P.productID = C.productID', function(
    err,
    products
  ) {
    if (err) return next(err);
    res.render('browse', { products });
    close(req);
  });
});

app.get('/specificProduct/:id', connectDb, function(req, res, next) {
  let id = req.params.id
  req.db.query('SELECT P.productName, P.description, P.supplierName, P.category FROM Products P WHERE productID = ?', [id], function(err, productDetails) {
    if (err) return next(err);
    if (productDetails.length === 0) {
      info(`Product with id ${id} not found`);
    } else {
      res.render('specificProduct', { productDetails });
    }
    close(req);
  });
});

//Handler for customer page
app.get('/customer', connectDb, function(req, res) {
  console.log('---Got request for the customer page---');

  res.render('customer');

  close(req);
});

//Handler for login page
app.get('/login', connectDb, function(req, res) {
  console.log('---Got request for the login page---');

  console.log('current user: ', req.body.username);

  res.render('login');

  close(req);
});

//Handler for signup page
app.get('/signup', connectDb, function(req, res) {
  console.log('---Got request for the signup page---');

  res.render('signup');

  close(req);
});

app.get('/signup-customer', connectDb, function(req, res) {
  console.log('---Got request for the signup-customer page---');

  res.render('signup-customer');

  close(req);
});

app.get('/signup-supplier', connectDb, function(req, res) {
  console.log('---Got request for the signup-supplier page---');

  res.render('signup-supplier');

  close(req);
});

//Handler for login POST submission
app.post('/login', connectDb, function(req, res) {
  console.log('---Got request for login action---');

  req.db.query('SELECT accountName, password, firstName, lastName FROM Customer WHERE accountName = ?', [req.body.username], function(err, data) {
      if (err) console.log(err)

      if(data.length == 0)
        res.render('login', {'message': 'Username not found'});
      else if (data[0].password != req.body.password)
        res.render('login', {'message': 'Password incorrect'})
      else {
        var response = {'first': data[0].firstName, 'last': data[0].lastName};
        console.log('Login successful');
        res.render('login-action', response);
      }
  })

  close(req);
});

//Handler for signup POST submission
app.post('/signup-customer', connectDb, function(req, res) {
  console.log('---Got request for signup-customer action---');

  console.log(req.body);

  res.render('signup-action');

  close(req);
});

app.post('/signup-supplier', connectDb, function(req, res) {
  console.log('---Got request for signup-supplier action---');

  console.log(req.body);

  res.render('signup-action');

  close(req);
});

//Handler for logout
app.get('/logout',(req,res) => {
  req.session.destroy((err) => {
      if(err) {
          return console.log(err);
      }
      res.redirect('/');
  });
});

/**
 * Handle all of the resources we need to clean up. In this case, we just need 
 * to close the database connection.
 * 
 * @param {Express.Request} req the request object passed to our middleware
 */
function close(req) {
  if (req.db) {
    req.db.end();
    req.db = undefined;
    console.log('Database connection closed');
  }
}
/**
 * Capture the port configuration for the server. We use the PORT environment
 * variable's value, but if it is not set, we will default to port 3945.
 */

const port = process.env.PORT || 57869;

/**
 * Start the server.
 */
app.listen(port, function() {
  console.log('== Server is listening on port', port);
});
