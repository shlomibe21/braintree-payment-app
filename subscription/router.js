'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const { SubscriptionsDB } = require('./models');

const router = express.Router();
let gateway = require('../lib/gateway');
const jsonParser = bodyParser.json();

const jwtAuth = passport.authenticate('jwt', { session: false });

router.post('/', jsonParser, (req, res) => {
    let subscriptionType = req.body.subscriptionType;
    res.status(200).json({ subscriptionType: subscriptionType });
});

// GET request to get current user's subscription
router.get("/subscription-db", jwtAuth, (req, res) => {
    SubscriptionsDB.find({ user: req.user.id })
        .then(subscriptions => {
            res.json({
                subscriptions: subscriptions.map(subscription => subscription.serialize())
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "GET Error: Internal server error" });
        });
});

// POST request, create a new subscription in DB
router.post("/subscription-db", jwtAuth, (req, res) => {
    console.log(req.user);
    const requiredFields = ["subscriptionId", "subscriptionType"];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    SubscriptionsDB.create({
        subscriptionId: req.body.subscriptionId,
        subscriptionType: req.body.subscriptionType,
        user: req.user.id
    })
        .then(SubscriptionsDB => {
            res.status(201).json(SubscriptionsDB.serialize());
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'POST Error: Internal server error' });
        });
});
module.exports = { router };