// PASSED
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-http'));
const URL = 'http://localhost:3000';
var endPoint = '';
var randomTag = randomNum(0, 9999999);

describe('Testing SETTINGS - /api/user/settings endpoints', function() {
  var name = 'Test User ' + randomTag;
  var g_username = 'testUser' + randomTag + '@gmail.com';
  var tos = false;
  var userName = 'testUser' + randomTag;
  var credentials = 'sampleCredentials' + randomTag;
  var userID = '';

  // SETTINGS
  var calView = 'Month';
  var modeOfTravel = 'car';
  var streetName = '123 Test Street';
  var cityName = 'Tempe';
  var stateName = 'Arizona';
  var zipName = '12345';

  it('Test 1: Create TestUser (POST)', function(done) {
    endPoint = '/api/user';
    var userPayload = {
      'name':name,
      'g_username':g_username,
      'termsOfService':tos,
      'userName':userName,
      'credentials':credentials
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

  it('Test 2: Create TestUser Settings (POST)', function(done) {
    endPoint = '/api/user/' + userID + '/settings';
    var settingsPayload = {
      'defaultCalView': calView,
      'modeOfTravel': modeOfTravel,
      'startAddress': {
        'street': streetName,
        'city': cityName,
        'state': stateName,
        'zipCode': zipName
      }
    };
    chai.request(URL)
      .post(endPoint)
      .set('authorization', 'skip')
      .send(settingsPayload)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        expect(err).to.be.null;
        expect(res).to.have.status(201);
        expect(res.body.message.startAddress.street).to.equal(streetName);
        expect(res.body.message.startAddress.city).to.equal(cityName);
        expect(res.body.message.startAddress.state).to.equal(stateName);
        expect(res.body.message.startAddress.zipCode).to.equal(zipName);
        expect(res.body.message.modeOfTravel[0]).to.equal(modeOfTravel);
        expect(res.body.message.defaultCalView).to.equal(calView);
        return done();
      });
  });

  it('Test 3: Validate TestUser Settings (GET)', function(done) {
    endPoint = '/api/user?g_username=' + g_username + '/settings';
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

  it('Test 4: Update TestUser Settings (PUT)', function(done) {
    endPoint = '/api/user/' + userID + '/settings';
    calView = 'Week';
    streetName = 'new' + streetName;
    cityName = 'new' + cityName;
    stateName = 'new' + stateName;
    zipName = 'new' + zipName;
    var newModeOfTravel = 'bus';
    var settingsPayload = {
      'defaultCalView': calView,
      'modeOfTravel': [modeOfTravel, newModeOfTravel],
      'startAddress': {
        'street': streetName,
        'city': cityName,
        'state': stateName,
        'zipCode': zipName
      }
    };
    chai.request(URL)
      .put(endPoint)
      .set('authorization', 'skip')
      .send(settingsPayload)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.message.startAddress.street).to.equal(streetName);
        expect(res.body.message.startAddress.city).to.equal(cityName);
        expect(res.body.message.startAddress.state).to.equal(stateName);
        expect(res.body.message.startAddress.zipCode).to.equal(zipName);
        expect(res.body.message.modeOfTravel[0]).to.equal(modeOfTravel);
        expect(res.body.message.modeOfTravel[1]).to.equal(newModeOfTravel);
        return done();
      });
  });

  it('Test 5: Remove TestUser Settings (DELETE)', function(done) {
    endPoint = '/api/user/' + userID + '/settings';
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

  it('Test 6: Validate TestUser Settings Removed (GET)', function(done) {
    endPoint = '/api/user/' + userID + '/settings';
    chai.request(URL)
      .get(endPoint)
      .set('authorization', 'skip')
      .end(function (err, res) {
        expect(err.message).to.equal('Not Found');
        expect(res).to.have.status(404);
        expect(res.body.message).to.equal('user has no settings defined');
        return done();
      });
  });

  it('Test 7: Delete TestUser (DELETE)', function(done) {
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
});

//borrowed logic from: https://blog.tompawlak.org/generate-random-values-nodejs-javascript
function randomNum (lowVal, highVal) {
  return Math.floor(Math.random() * (highVal - lowVal + 1) + lowVal);
}