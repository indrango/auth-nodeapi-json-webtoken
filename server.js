//Get the package
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');

//Configuration
var port = process.env.PORT || 8080;
mongoose.connect(config.database, function(err) { //Conect database
  if (err) {
    console.log('Connection failed!');
  }
  console.log('Connection successfully.');
});
app.set('superSecret', config.secret); //Secret variabel

//Use body parser  to get info from URL parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Use morgan to log request to the console
app.use(morgan('dev'));

//======= ROUTES =========//
app.get('/', function(req, res) {
  res.send('The API is at http://localhost:'+port+'/api');
})

app.get('/setup', function(req, res) {
  //Create a sample user
  var indra = new User({
    name: 'Indra Nugraha',
    password: 'password',
    admin: true
  });

  indra.save(function(err) {
    if (err) {
      console.log(err);
    }
    console.log('User saved successfully.');
    res.json({success: true});
  });
});

//======== API Routes ==========//
var apiRoutes = express.Router();
//Route to return all users
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

apiRoutes.post('/authenticate', function(req, res) {
  //Find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) {
      console.log(err);
    }
    if (!user) {
      res.json({success: false, message: 'Authentication failed. User not found.'});
    }else if (user) {

      //Check if the password matches
      if (user.password != req.body.password) {
        res.json({success: false, message: 'Authentication failed. Wrong password. '});
      }else {
        //If user found and password right
        //Create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 //Expires in 24 hours
        });

        //Return the informating including token as json
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }
    }
  });
});

//Route the middleware to verify a token
apiRoutes.use(function(req, res, next) {
  //Check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  //Decode token
  if (token) {
    //Verifies secret and checks Expires
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({success: false, message: 'Failed to authenticate token.'});
      } else {
        //If everything is good, save to reques for use in other routes
        req.decoed = decoded;
        next();
      }
    });
  }else {
    //If there is no token
    //Return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }

});

//Apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

//====== Start The Server =======//
app.listen(port);
console.log('Server running at http://localhost:'+port);
