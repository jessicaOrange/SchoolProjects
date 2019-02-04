// PASSED
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-http'));
const URL = 'http://localhost:3000';
var endPoint = '';
var randomTag = randomNum(0, 9999999);

describe('Testing USER - /api/user endpoints', function () {
  var name = 'Test User' + randomTag;
  var g_username = 'testUser' + randomTag + '@gmail.com';
  var tos = false;
  var userName = 'testUser' + randomTag;
  var credentials = 'sampleCredentials' + randomTag;
  var userID = '';

  it('Test 1: Create TestUser (POST)', function (done) {
    endPoint = '/api/user';
    var userPayload = {
      'name': name,
      'g_username': g_username,
      'termsOfService': tos,
      'userName': userName,
      'credentials': credentials
    };
    chai.request(URL)
      .post(endPoint)
      .set('authorization', 'skip')
      .send(userPayload)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        expect(err).to.be.null;
        expect(res).to.have.status(201);
        userID = res.body.message._id;
        expect(res.body.message.name).to.equal(name);
        expect(res.body.message.g_username).to.equal(g_username);
        expect(res.body.message.termsOfService).to.equal(tos);
        return done();
      });
  });

  it('Test 2: Validate TestUser (GET)', function (done) {
    endPoint = '/api/user?g_username=' + g_username;
    chai.request(URL)
      .get(endPoint)
      .set('authorization', 'skip')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.message).to.equal(true);
        return done();
      });
  });

  it('Test 3: Validate TestUser1 does not exist (GET)', function (done) {
    endPoint = '/api/user?g_username=' + g_username + '1';
    chai.request(URL)
      .get(endPoint)
      .set('authorization', 'skip')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.message).to.equal(false);
        return done();
      });
  });

  it('Test 4: Update TestUser (PUT)', function (done) {
    endPoint = '/api/user/' + userID;
    name = 'new' + name;
    g_username = 'new' + g_username;
    tos = true;
    userName = 'new' + userName;
    var userPayload = {
      'name': name,
      'g_username': g_username,
      'termsOfService': tos,
      'userName': userName
    };
    chai.request(URL)
      .put(endPoint)
      .set('authorization', 'skip')
      .send(userPayload)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.message.name).to.equal(name);
        expect(res.body.message._id).to.equal(userID);
        expect(res.body.message.termsOfService).to.equal(true);
        return done();
      });
  });

  it('Test 5: Delete TestUser (DELETE)', function (done) {
    endPoint = '/api/user/' + userID;
    chai.request(URL)
      .del(endPoint)
      .set('authorization', 'skip')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        expect(err).to.be.null;
        expect(res).to.have.status(204);
        return done();
      });
  });

  it('Test 6: Validate TestUser deleted (GET)', function (done) {
    endPoint = '/api/user?g_username=' + g_username;
    chai.request(URL)
      .get(endPoint)
      .set('authorization', 'skip')
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        expect(err);
        expect(res).to.have.status(200);
        expect(res.body.message).to.equal(false);
        return done();
      });
  });
});

//borrowed logic from: https://blog.tompawlak.org/generate-random-values-nodejs-javascript
function randomNum(lowVal, highVal) {
  return Math.floor(Math.random() * (highVal - lowVal + 1) + lowVal);
}