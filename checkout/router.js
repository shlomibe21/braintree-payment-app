'use strict';

const express = require('express');
let braintree = require('braintree');
const bodyParser = require('body-parser');
const passport = require('passport');

const router = express.Router();
let gateway = require('../lib/gateway');
const jsonParser = bodyParser.json();

const jwtAuth = passport.authenticate('jwt', {
  session: false
});

const {
  SubscriptionsDB
} = require('../subscription/models');

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
      res.status(400).json({
        'message': err
      });
    } else {
      res.status(200).json({
        clientToken: response.clientToken
      });
    }
  });
});

// Get request to generate a clientToken with customer id
router.get("/newWithCustomerId", jwtAuth, function (req, res) {
  // We use the user id as the customer id on the payment server
  let customerId = req.user.id;

  // Check if customer with this id already exists
  gateway.customer.find(customerId, function (err, customer) {
    if (err) {
      if (err.type === "notFoundError") {
        // Customer not found, generate a token for a new cusotmer
        gateway.clientToken.generate({}, function (err, response) {
          if (err) {
            res.status(400).json({
              'message': err
            });
          } else {
            res.status(200).json({
              clientToken: response.clientToken
            });
          }
        });
      } else {
        // Another error retuen to client
        res.status(400).json({
          'message': err
        });
      }
    } else {
      // Customer already exists generate a token for the current customer
      gateway.clientToken.generate({
        customerId: customerId
      },
        function (err, response) {
          if (err) {
            res.status(400).json({
              'message': err
            });
          } else {
            res.status(200).json({
              clientToken: response.clientToken
            });
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
      res.status(500).json({
        'message': errorMsg
      });
    }
  });
});

// POST a new payment request for a new subscription for the current customer
router.post('/newWithCustomerId', jwtAuth, (req, res) => {
  // We use the user id as the customer id on the payment server
  const customerId = req.user.id;
  const nonce = req.body.payment_method_nonce;
  const currentSubscriptionId = req.body.subscriptionId;
  const planId = "OncaBasic";
  const userId = req.user.id;
  let paymentMethodToken;

  // Check if customer with this id already exists
  gateway.customer.find(customerId, function (err, customer) {
    if (err) {
      if (err.type === "notFoundError") {
        // Customer not found, create a new cusotmer and add the payment method
        return gateway.customer.create({
          paymentMethodNonce: nonce,
          id: customerId,
        })
          .then(result => {
            if ((!result.success) && (!result.transaction)) {
              let deepErrors = result.errors.deepErrors();
              let errorMsg = '';
              errorMsg = formatErrors(deepErrors);
              return Promise.reject({
                code: 400,
                reason: 'CustomerCreateError',
                message: errorMsg,
                location: 'checkout'
              });
            }
            // Get the paymentMethod token that was just added to the system for this new customer
            // Since this is a new customer there is only one payment method in the system
            console.log(result.customer.paymentMethods[0].token);
            paymentMethodToken = result.customer.paymentMethods[0].token
          })
          .then(() => {
            // Create a new subscription for this customer
            return gateway.subscription.create({
              paymentMethodToken: paymentMethodToken,
              planId: planId
            });
          })
          .then(result => {
            if ((!result.success) && (!result.transaction)) {
              let deepErrors = result.errors.deepErrors();
              let errorMsg = '';
              errorMsg = formatErrors(deepErrors);
              return Promise.reject({
                code: 400,
                reason: 'SubscriptionCreateError',
                message: errorMsg,
                location: 'checkout'
              });
            }
            // Update the DB with the info of the new subscription
            console.log('subscriptionId', result.subscription.id);

            return SubscriptionsDB.create({
              subscriptionId: result.subscription.id,
              subscriptionType: planId,
              user: userId
            })
          })
          .then(result => {
            res.status(200).send(result)
          })
          .catch(err => {
            // Forward errors on to the client, if not specific error,
            // give a 500 error since something unexpected has happened
            if (err.reason) {
              return res.status(err.code).json(err);
            }
            res.status(500).json({
              code: 500,
              message: err.message
            });
          })
      } else {
        // Another error, return to client
        res.status(400).json({
          'message': err
        });
      }
    } else {
      // Current customer is not new, get the token of the 
      // method that was selected or entered by the user on the payment page
      // and try to create a new PaymentMethod
      // Note: if PaymentMethod already exists the gateway won't create a new one! 
      try {
        return gateway.paymentMethod.create({
          customerId: customerId,
          paymentMethodNonce: nonce,
        })
          .then((result) => {
            if ((!result.success) && (!result.transaction)) {
              let deepErrors = result.errors.deepErrors();
              let errorMsg = '';
              errorMsg = formatErrors(deepErrors);
              return Promise.reject({
                code: 400,
                reason: 'PaymentCreateError',
                message: errorMsg,
                location: 'checkout'
              });
            }
            // Create customer was success update paymentMethodToken
            paymentMethodToken = result.paymentMethod.token;
            console.log("result.paymentMethod.token: " + paymentMethodToken);
          })
          .then(() => {
            // Check if user already has a subscription and if yes cancel it
            if (currentSubscriptionId) {
              return gateway.subscription.find(
                currentSubscriptionId
              )
                .catch((err) => {
                  // 'notFoundError' message is normal and it is just telling us that this customer doesn't have any subscription yet.
                  // TODO: consider to return an error in case that we have another error message
                  if (err.type !== "notFoundError") {

                  }
                })
            }
          })
          .then((result) => {
            if (result) {
              // Customer already has a subscription cancel it
              if (result.id) {
                return gateway.subscription.cancel(
                  result.id
                );
              }
            }
          })
          .then((result) => {
            // Create a new subscription for this customer
            return gateway.subscription.create({
              paymentMethodToken: paymentMethodToken,
              planId: planId
            });
          }).then(result => {
            if ((!result.success) && (!result.transaction)) {
              let deepErrors = result.errors.deepErrors();
              let errorMsg = '';
              errorMsg = formatErrors(deepErrors);
              return Promise.reject({
                code: 400,
                reason: 'SubscriptionCreateError',
                message: errorMsg,
                location: 'checkout'
              });
            }
            // Update the DB with the info of the new subscription
            console.log('subscriptionId', result.subscription.id);
            if (currentSubscriptionId) {
              const toUpdate = {
                subscriptionId: result.subscription.id,
                subscriptionType: planId
              };
              SubscriptionsDB.findOneAndUpdate({
                subscriptionId: currentSubscriptionId
              }, {
                  $set: toUpdate
                }, {
                  new: true
                })
                .then(subscrioption => res.status(201).send(subscrioption))
            } else {
              SubscriptionsDB.create({
                subscriptionId: result.subscription.id,
                subscriptionType: planId,
                user: userId
              })
                .then(subscrioption => res.status(200).send(subscrioption))
            }
          })
          .catch(err => {
            // Forward errors on to the client, if not specific error,
            // give a 500 error since something unexpected has happened
            if (err.reason) {
              return res.status(err.code).json(err);
            }
            res.status(500).json({
              code: 500,
              message: 'Internal server error'
            });
          });
      } catch (err) {
        console.error(err.message);
      }
    }
  });
});

// GET user's subscription info from Braintree server
router.get("/subscriptionInfoWithCustomerId", jwtAuth, (req, res) => {
  // We use the user id as the customer id on the payment server
  let customerId = req.user.id;

  gateway.customer.find(customerId, function (err, customer) {
    if (err) {
      let msg = ';'
      if (err.type === "notFoundError") {
        msg = 'User not found!'
      }
      else {
        // Another error, return to client
        msg = err;
      }
      // Return to client
      res.status(400).json({
        'message': msg
      });

    }
    else {
      console.log(customer);
      res.status(200).json({
        customer: customer
      });
    }
  });
});

module.exports = {
  router
};