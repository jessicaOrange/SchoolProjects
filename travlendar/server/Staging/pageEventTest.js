// PASSED
// MUST UPDATE VARs to match oauth user in DB for successful test
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-http'));
const URL = 'http://localhost:3000';
var endPoint = '';
var randomTag = randomNum(0, 9999999);

describe('Testing EVENTS - /api/user/events endpoints', function() {
    var g_username = 'gamorri1@asu.edu';
    var userID = '5ad117227b12d033a08caebc';

    // EVENTS
    var event1ID = '';
    var event2ID = '';

    //
    // What the fuck?

    it('Test 1: Verify DBUser (GET)', function(done) {
        endPoint = '/api/user?g_username=' + g_username;
        chai.request(URL)
            .get(endPoint)
            .set('authorization', 'skip')
            .end(function(err, res) {
                if(err) {
                    return done(err);
                }
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.message).to.equal(true);
                return done();
            });
    });

    it('Test 2: Create DBUser Event #1 (POST)', function(done) {
        endPoint = '/api/user/' + userID + '/events';
        var eventsPayload = {
            resource: {
                summary: 'Body look',
                start: null,
                end: null,
                description: 'Hey body',
                reminders: {
                    useDefault: true
                },
                location: '4541 S Mill Ave, Tempe, AZ 85282, USA',
                recurrence: null
            },
            isAllDayEvent: false,
            isTraveling: false,
            isFloatingEvent: false,
            startLocation: {
                street: '',
                city: '',
                state: '',
                zipcode: '',
                country: 'US',
                lat: -1,
                lon: -1
            },
            endLocation: {
                street: '4541 S Mill Ave',
                city: 'Tempe',
                state: 'AZ',
                zipcode: '85282',
                country: 'USA',
                lat: 33.3841835,
                lon: -111.93897019999997
            },
            transportation: {
                usingRecommendation: true,
                to: '',
                from: ''
            },
            notification: {
                hasNotification: false,
                minutesPrior: 5
            }
        };
        chai.request(URL)
            .post(endPoint)
            .set('authorization', 'skip')
            .send(eventsPayload)
            .end(function(err, res) {
                if(err) return done(err);

                expect(err).to.be.null;
                expect(res).to.have.status(200);
                event1ID = res.body.message.events[0].event_id;
                expect(res.body.message.events[0].resource.description).to.equal('Hey body');
                expect(res.body.message.events[0].isAllDayEvent).to.equal(false);
                expect(res.body.message.events[0].endLocation.zipcode).to.equal('85282');
                return done();
            });
    });

    it('Test 3: Change DBUser Event #1 (PUT)', function(done) {
        endPoint = '/api/user/' + userID + '/events/' + event1ID;
        let newZip = '85212';
        let newEventsPayload = {
            endLocation: {
                zipcode: newZip
            }
        };
        chai.request(URL)
            .put(endPoint)
            .set('authorization', 'skip')
            .send(newEventsPayload)
            .end(function(err, res) {
                if(err) return done(err);

                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.message.events[0].endLocation.zipcode).to.equal(newZip);
                return done();
            });
    });

    it('Test 4: Create DBUser Event #2 (POST)', function(done) {
        endPoint = '/api/user/' + userID + '/events';
        var eventsPayload = {
            resource: {
                summary: 'Body look 2',
                start: null,
                end: null,
                description: 'Hey body 2',
                reminders: {
                    useDefault: true
                },
                location: '4541 S Mill Ave, Tempe, AZ 85282, USA',
                recurrence: null
            },
            isAllDayEvent: false,
            isTraveling: false,
            isFloatingEvent: false,
            startLocation: {
                street: '',
                city: '',
                state: '',
                zipcode: '',
                country: 'US',
                lat: -1,
                lon: -1
            },
            endLocation: {
                street: '4541 S Mill Ave',
                city: 'Tempe',
                state: 'AZ',
                zipcode: '85306',
                country: 'USA',
                lat: 33.3841835,
                lon: -111.93897019999997
            },
            transportation: {
                usingRecommendation: true,
                to: '',
                from: ''
            },
            notification: {
                hasNotification: false,
                minutesPrior: 5
            }
        };
        chai.request(URL)
            .post(endPoint)
            .set('authorization', 'skip')
            .send(eventsPayload)
            .end(function(err, res) {
                if(err) return done(err);

                expect(err).to.be.null;
                expect(res).to.have.status(200);
                event2ID =
                expect(res.body.message.events[1].resource.description).to.equal('Hey body 2');
                expect(res.body.message.events[1].isAllDayEvent).to.equal(false);
                expect(res.body.message.events[1].endLocation.zipcode).to.equal('85306');
                return done();
            });
    });

    it('Test 5: Remove DBUser Event #1 (DELETE)', function(done) {
        endPoint = '/api/user/' + userID + '/events/' + event1ID;
        chai.request(URL)
            .del(endPoint)
            .set('authorization', 'skip')
            .end(function (err, res) {
                if (err) return done(err);

                expect(err).to.be.null;
                expect(res).to.have.status(204);
                return done();
            });
    });

    it('Test 6: Verify DBUser Event #1 no longer exists (GET)', function(done) {
        endPoint = '/api/user/' + userID + '/events/' + event1ID;
        chai.request(URL)
            .get(endPoint)
            .set('authorization', 'skip')
            .end(function (err, res) {
                expect(err.message).to.equal('Not Found');
                expect(res).to.have.status(404);
                expect(res.body.message).to.equal(false);
                return done();
            });
    });

    it('Test 7: Verify DBUser Event #2 exists (GET)', function(done) {
        endPoint = '/api/user/' + userID + '/events/' + event2ID;
        chai.request(URL)
            .get(endPoint)
            .set('authorization', 'skip')
            .end(function (err, res) {
                if(err) return done(err);
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body.message).to.equal(true);
                return done();
            });
    });

});

//borrowed logic from: https://blog.tompawlak.org/generate-random-values-nodejs-javascript
function randomNum(lowVal, highVal) {
    return Math.floor(Math.random() * (highVal - lowVal + 1) + lowVal);
}