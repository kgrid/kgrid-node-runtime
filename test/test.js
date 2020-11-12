let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
chai.use(chaiHttp);

describe('POST /deployments', () => {

    it('should return the endpoint ', (done) => {
        let input = {
            "uri": "/ri/bmi/v2.0/bmicalc",
            "baseUrl": "https://kgrid-lab.github.io/testobj/ri-bmicalc-v2.0",
            "artifact": [
                "bmi.js"
            ],
            "entry": "bmi.js",
            "function": "bmicalc"
        }
        chai.request(server)
            .post('/endpoints')
            .send(input)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('should respond not found if nothing at resource URL', (done) => {
        let input = {
            "uri": "/99999/cp4mc9723s/v0.2.0/dosingrecommendation",
            "entry": "recommendation.js",
            "baseUrl": "https://github.com/kgrid-objects/cpic-collection/releases/download/2.0.0/",
            "artifact": ['https://github.com/kgrid-objects/cpic-collection/releases/download/2.0.0/99999-cp4mc9723sd-0.2.0.zip'
            ]
        }
        chai.request(server)
            .post('/endpoints')
            .send(input)
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    it('should respond 400 if missing Resource URL', (done) => {
        let input = {
            "identifier": "ark:/hello/world",
            "endpoint": "welcome",
            "entry": "recommendation.js"
        }
        chai.request(server)
            .post('/endpoints')
            .send(input)
            .end((err, res) => {
                res.should.have.status(400);
                done();
            });
    });
});

describe('GET /', () => {
    it('should GET the home view', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });
});
