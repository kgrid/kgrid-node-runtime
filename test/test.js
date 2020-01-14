//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();


chai.use(chaiHttp);
/*
  * Test the /GET route
  */
describe('POST /activate', () => {
    it('it should return the endpoint URL', (done) => {
      let input = {
      	"arkid":"ark:/99999/cp4mc9723sd",
        "version":"v0.2.0",
      	"endpoint":"dosingrecommendation",
      	"url":['https://github.com/kgrid-objects/cpic-collection/releases/download/2.0.0/99999-cp4mc9723se-v0.2.0.zip',
            'https://github.com/kgrid-objects/cpic-collection/releases/download/2.0.0/99999-cp4mc9723sd-v0.2.0.zip',
            'https://kgrid-activator.herokuapp.com/kos/99999/fk47h1x090/v0.2.0/phenotype.js'
          ]
      }
      chai.request(server)
          .post('/activate')
          .send(input)
          .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('endpoint_url');
            done();
          });
    });
    it('missing Resource URL', (done) => {
      let input = {
      	"arkid":"ark:/hello/world",
      	"endpoint":"welcome",
      	"url":""
      }
      chai.request(server)
          .post('/activate')
          .send(input)
          .end((err, res) => {
            res.body.should.be.empty;
            done();
          });
    });
});

describe('GET /', () => {
      it('it should GET the home view', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                  res.should.have.status(200);
              done();
            });
      });
    });
