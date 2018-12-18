'use strict'

const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
const jsonParser = bodyParser.json();

// GET request
router.get('/', (req, res) => {
    res.json({ ok: true });
});


module.exports = { router };