// NOT PASSING
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-http'));
const URL = 'http://localhost:3000';
var endPoint = '';
var randomTag = randomNum(0, 9999999);

describe('TBD - /api/user endpoints', function () {

    it('Test 1: TBD', function (done) {
        endPoint = '/api/user';
        chai.request(URL)
            .post(endPoint)
            .set('authorization', 'skip')
            .send(tbd)
            .end(function (err, res) {
                if (err) {
                    console.log("ERROR");
                    return done(err);
                }
                console.log("WORKING");
                return done();
            });
    });

});

//borrowed logic from: https://blog.tompawlak.org/generate-random-values-nodejs-javascript
function randomNum(lowVal, highVal) {
    return Math.floor(Math.random() * (highVal - lowVal + 1) + lowVal);
}