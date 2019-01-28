'use strict';

let braintree = require('braintree');
let environment, gateway;

require('dotenv').load();
environment = braintree.Environment.Sandbox;

gateway = braintree.connect({
  environment: environment,
  merchantId: process.env.BT_MERCHANT_ID,
  publicKey: process.env.BT_PUBLIC_KEY,
  privateKey: process.env.BT_PRIVATE_KEY
});

//console.log(gateway);

module.exports = gateway;
