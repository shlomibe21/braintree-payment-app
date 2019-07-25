'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');

let gateway = require('../lib/gateway');
const { app, runServer, closeServer } = require("../server");

const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

describe('Checkout index page', function () {
    it('redirects to the checkout new page', function () {
        return chai.request(app)
        .get('/')
        .then(function (res) {
            res.should.have.status(200);
        });
    });

    it("Should get 200 on GET /checkout/new requests", function () {
        return chai.request(app)
            .get("/checkout/new")
            .then(function (res) {
                expect(res).to.have.status(200);
            });
    });

    /*it('generates a client token', function (done) {
        return chai
        .request(app)
        .get('/checkout/new')
        .then(function (res) {
            expect(res.text).to.match(/let token = \'[\w=]+\';/);
        });
    });*/
});

describe('Checkout create', function () {
    it('creates a transaction and redirects to checkout show', function () {
        return chai.request(app)
            .post('/checkout')
            .send({ amount: '10.00', payment_method_nonce: 'fake-valid-nonce' }) // eslint-disable-line camelcase
            .then(function (res) {
                expect(res).to.have.status(302);
            });
    });
});


