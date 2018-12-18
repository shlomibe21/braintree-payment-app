'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');

const { app, runServer, closeServer } = require("../server");

const should = chai.should();

chai.use(chaiHttp);

describe("Test GET", function () {
    it("Should get 200 on GET requests", function () {
        return chai
            .request(app)
            .get("/api/payments/")
            .then(function (res) {
                res.should.have.status(200);
                res.should.be.json;
            });
    });
}); 