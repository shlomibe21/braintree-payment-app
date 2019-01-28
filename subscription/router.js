'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
let gateway = require('../lib/gateway');
const jsonParser = bodyParser.json();

router.post('/', jsonParser, (req, res) => {
    let subscriptionType = req.body.subscriptionType;
    res.status(200).json({ subscriptionType: subscriptionType });
});

module.exports = { router };