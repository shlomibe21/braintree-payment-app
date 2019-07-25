'use strict';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

//const PORT = process.env.PORT || 3000;

// Mongoose internally uses a promise-like object,
// but its better to make Mongoose use built in es6 promises
mongoose.Promise = global.Promise;

const { DATABASE_URL, PORT } = require('./config');
const app = express();

const { router: usersRouter } = require('./users');
const { router: checkoutsRouter } = require('./checkout');
const { router: subscriptionRouter } = require('./subscription');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
const bodyParser = require('body-parser');

// Logging
app.use(morgan('common'));

app.use(express.static('public'));
app.use(bodyParser.json());

passport.use(localStrategy);
passport.use(jwtStrategy);

// CORS
// Import the library:
const cors = require("cors");
const { CLIENT_ORIGIN } = require("./config");
// Use it before routes are set up:
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
/*app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    if (req.method === 'OPTIONS') {
        return res.send(204);
    }
    next();
});*/

app.use('/checkout/', checkoutsRouter);
app.use('/subscription/', subscriptionRouter);
app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });

// A protected endpoint which needs a valid JWT to access it
app.get('/api/protected', (req, res) => {
    return res.json({
        data: 'rosebud'
    });
});

// catch-all endpoint if client makes request to non-existent endpoint
app.use('*', function (req, res) {
    res.status(404).json({ message: 'Not Found' });
});

app.use(function( req, res, next, error) {
    //res.status(500).json({ message: 'Internal server error' });
});

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, { useNewUrlParser: true }, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { runServer, app, closeServer };