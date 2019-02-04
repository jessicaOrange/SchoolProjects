'use strict';

var mapsApi = require('@google/maps');

//TODO -- Update key to the project key.
var gMapsClient = mapsApi.createClient({
    key: 'AIzaSyBMmhjtXEKpAbYHjL2A3NqBKpu7CemTv90'
});

/**
 * Call Google's Maps Matrix API for the travel time.
 * Note: you can only call for one mode of transport at a time.
 * @param params 'Options based on Google query'
 * @param callback 'method to call after response has been received'.
 */
module.exports.getTravelTime = function(params, callback){
    gMapsClient.distanceMatrix(params, function(err, res){
        return callback(err, res);
    })
};

