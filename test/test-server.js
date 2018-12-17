'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');

const { app, runServer, closeServer } = require("../server");

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;

chai.use(chaiHttp);

describe("Test GET root url", function () {
    /*before(function () {
        return runServer();
    });
    after(function () {
        return closeServer();
    });*/

    it("Should get 200 code on GET", function () {
        return chai
            .request(app)
            .get("/")
            .then(function (res) {
                expect(res).to.have.status(200);
            });
    });
}); 