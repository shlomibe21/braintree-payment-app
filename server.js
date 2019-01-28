'use strict';

const express = require('express');

const PORT = process.env.PORT || 3000;

const { router: checkoutsRouter } = require('./checkouts');
const { router: subscriptionRouter } = require('./subscription');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());

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

app.use('/checkouts/', checkoutsRouter);
app.use('/subscription/', subscriptionRouter);

// catch-all endpoint if client makes request to non-existent endpoint
app.use('*', function (req, res) {
    res.status(404).json({ message: 'Not Found' });
});

app.use(function( req, res, next, error) {
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Your app is listening on port ${PORT}`);
});

module.exports = { app };