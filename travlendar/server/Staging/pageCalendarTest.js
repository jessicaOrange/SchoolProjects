// PASSED
// MUST UPDATE VARs to match oauth user in DB for successful test
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-http'));
const URL = 'http://localhost:3000';
var endPoint = '';
var randomTag = randomNum(0, 9999999);

describe('Testing CALENDAR - /api/user/calendar endpoints', function() {
    var g_username = 'gamorri1@asu.edu';
    var userID = '5abb14c8b369bf237c095d0f';

    // CALENDAR
    var gCal_key = 'f5MoyziPrq4VRvaS';
    var gCal_summary = 'Travlendar Calendar (dev)';
    var gCal_id = 'asu.edu_l8qg7kq7bmb3hunk26in672bm0@group.calendar.google.com';

    it('Test 1: Get DBUser (GET)', function(done) {
        endPoint = '/api/user?g_username=' + g_username;
        chai.request(URL)
            .get(endPoint)
            .set('authorization', 'skip')
            .end(function(err, res) {
                if(err) return done(err);
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.message).to.equal(true);
                return done();
            });
    });

    it('Test 2: Get DBUser Calendar (GET)', function(done) {
        endPoint =  '/api/user/' + userID + '/calendar';
        chai.request(URL)
            .get(endPoint)
            .set('authorization', 'skip')
            .end(function(err, res) {
                if(err) return done(err);
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.message.calendar.gCal_id).to.equal(gCal_id);
                expect(res.body.message.calendar.gCal_summary).to.equal(gCal_summary);
                expect(res.body.message.calendar.gCal_key).to.equal(gCal_key);
                return done();
            });
    });

    it('Test 3: Verify cannot modify DBUser Calendar (PUT)', function(done) {
        endPoint =  '/api/user/' + userID + '/calendar';
        let gCal_summary2 = gCal_summary + " #2";
        let gCal_id2 = gCal_id + " #2";
        let gCal_key2 = gCal_key + " #2";
        let calendarPayload = {
            'gCal_summary': gCal_summary2
        };
        chai.request(URL)
            .put(endPoint)
            .set('authorization', 'skip')
            .send(calendarPayload)
            .end(function(err, res) {
                if(err) return done(err);
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.message.calendar.gCal_summary).to.not.equal(gCal_summary2);
                expect(res.body.message.calendar.gCal_id).to.not.equal(gCal_id2);
                expect(res.body.message.calendar.gCal_key).to.not.equal(gCal_key2);
                return done();
            });
    });

    it('Test 4: Verify cannot modify DBUser Calendar (POST)', function(done) {
        endPoint =  '/api/user/' + userID + '/calendar';
        let gCal_summary2 = gCal_summary + " #2";
        let gCal_id2 = gCal_id + " #2";
        let gCal_key2 = gCal_key + " #2";
        let calendarPayload = {
            'gCal_summary': gCal_summary2
        };
        chai.request(URL)
            .put(endPoint)
            .set('authorization', 'skip')
            .send(calendarPayload)
            .end(function(err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.message.calendar.gCal_summary).to.not.equal(gCal_summary2);
                expect(res.body.message.calendar.gCal_id).to.not.equal(gCal_id2);
                expect(res.body.message.calendar.gCal_key).to.not.equal(gCal_key2);
                return done();
            });
    });

    it('Test 5: Verify delete DBUser Calendar (DELETE)', function(done) {
        endPoint =  '/api/user/' + userID + '/calendar';
        chai.request(URL)
            .del(endPoint)
            .set('authorization', 'skip')
            .end(function(err, res) {
                if(err) return done(err);
                expect(err).to.be.null;
                expect(res).to.have.status(204);
                return done();
            });
    });

});

//borrowed logic from: https://blog.tompawlak.org/generate-random-values-nodejs-javascript
function randomNum(lowVal, highVal) {
  return Math.floor(Math.random() * (highVal - lowVal + 1) + lowVal);
}