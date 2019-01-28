'use strict';

const express = require('express');
let braintree = require('braintree');
const bodyParser = require('body-parser');

const router = express.Router();
let gateway = require('../lib/gateway');
const jsonParser = bodyParser.json();

let TRANSACTION_SUCCESS_STATUSES = [
  braintree.Transaction.Status.Authorizing,
  braintree.Transaction.Status.Authorized,
  braintree.Transaction.Status.Settled,
  braintree.Transaction.Status.Settling,
  braintree.Transaction.Status.SettlementConfirmed,
  braintree.Transaction.Status.SettlementPending,
  braintree.Transaction.Status.SubmittedForSettlement
];

function formatErrors(errors) {
  let formattedErrors = '';

  // Iterate through all returned deep errors messages
  for (let i in errors) {
    if (errors.hasOwnProperty(i)) {
      // Save deep errors message to send back to the client
      formattedErrors += 'Error: ' + i + 1 + ') ' + errors[i].message + ' Code: ' + errors[i].code + ' Attribute: ' + errors[i].attribute + '\n';
    }
  }
  return formattedErrors;
}

router.get('/', (req, res) => {
  res.redirect('/new');
});

// GET request to generate a clientToken
router.get("/new", function (req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    if (err) {
      res.status(400).json({ 'message': err });
    }
    else {
      res.status(200).json({ clientToken: response.clientToken });
    }
  });
});

// Get request to generate a clientToken with customer id
router.get("/new/:id", function (req, res) {
  let customerId = req.params.id;

  // Check if customer with this id already exists
  gateway.customer.find(customerId, function (err, customer) {
    if (err) {
      if (err.type === "notFoundError") {
        // Customer not found, generate a token for a new cusotmer
        gateway.clientToken.generate({}, function (err, response) {
          if (err) {
            res.status(400).json({ 'message': err });
          }
          else {
            res.status(200).json({ clientToken: response.clientToken });
          }
        });
      }
      else {
        // Another error retuen to client
        res.status(400).json({ 'message': err });
      }
    }
    else {
      // Customer already exists generate a token for the current customer
      gateway.clientToken.generate({ customerId: customerId },
        function (err, response) {
          if (err) {
            res.status(400).json({ 'message': err });
          }
          else {
            res.status(200).json({ clientToken: response.clientToken });
          }
        });
    }
  });
});

// POST a new payment request and store the transaction info in the vault upon success
router.post('/new', (req, res) => {
  let amount = req.body.amount; // In production you should not take amounts directly from clients
  let nonce = req.body.payment_method_nonce;

  gateway.transaction.sale({
    amount: amount,
    paymentMethodNonce: nonce,
    options: {
      submitForSettlement: true,
      storeInVaultOnSuccess: true
    }
  }, (error, result) => {
    if (result.success || result.transaction) {
      //res.redirect('/' + result.transaction.id);
      //res.status(200);
      res.send(result);
    } else {
      let deepErrors = result.errors.deepErrors();
      let errorMsg = '';

      errorMsg = formatErrors(deepErrors);
      res.status(500).json({ 'message': errorMsg });
    }
  });
});

// POST a new payment request with customer id
// If customer doesn't exist in Braintree server, create a new customer 
// and add the payment method that the user just added to the system
router.post('/new/:id', (req, res) => {
  let customerId = req.params.id;
  let amount = req.body.amount; // In production you should not take amounts directly from clients
  let nonce = req.body.payment_method_nonce;

  // Check if customer with this id already exists
  gateway.customer.find(customerId, function (err, customer) {
    if (err) {
      if (err.type === "notFoundError") {
        // Customer not found, create a new cusotmer and add the payment method
        gateway.customer.create({
          paymentMethodNonce: nonce,
          id: customerId,
          creditCard: {
            billingAddress: {
              firstName: "Jen",
              lastName: "Smith",
              company: "Braintree",
              streetAddress: "123 Address",
              locality: "City",
              region: "State",
              postalCode: "12345"
            }
          }
        }, function (err, result) {
          if (err) {
            res.status(400).json({ 'message': err });
          }
          else {
            // Get the paymentMethod token that was just added to the system for this new customer
            // Since this is a new customer there is only one payment method in the system
            console.log(result.customer.paymentMethods[0].token);
            let paymentMethodToken = result.customer.paymentMethods[0].token
            // Create a new subscription for this customer
            gateway.subscription.create({
              paymentMethodToken: paymentMethodToken,
              planId: "OncaBasic"
            }, function (err, result) {
              if (err) {
                console.log("Can't create a subscription");
              }
              else {
                res.status(200).res.send(result);
              }
            });
          }
        });
      }
      else {
        // Another error retuen to client
        res.status(400).json({ 'message': err });
      }
    }
    else {
      // If current customer is not new, get the token of the 
      // method that was selected or entered by the user on the payment page
      // and try to create a new PaymentMethod
      // Note: if PaymentMethod already exists the gateway won't create a new one! 
      try {
        gateway.paymentMethod.create({
          customerId: customerId,
          paymentMethodNonce: nonce,
        }, function (err, result) {
          if (err) {
            console.log(err);
          }
          else {
            if (result.success || result.transaction) {
              result.paymentMethod.token;
              console.log("result.paymentMethod.token: " + result.paymentMethod.token);
              // Check if user already has a subscription and if yes cancel it
              gateway.subscription.find("aSubscriptionId", function (err, result) {
              });
              // Create a new subscription for the current customer
              gateway.subscription.create({
                paymentMethodToken: result.paymentMethod.token,
                planId: "OncaBasic"
              }, function (err, result) {
                if (err) {
                  console.log("Can't create a subscription");
                }
                else {
                  res.status(200).send(result);
                }
              });
            } else {
              let deepErrors = result.errors.deepErrors();
              let errorMsg = '';
              errorMsg = formatErrors(deepErrors);
              res.status(500).json({ 'message': errorMsg });
            }
          }
        });
      }
      catch (err) {
        console.error(err.message);
      }
    }
  });
});

module.exports = { router };