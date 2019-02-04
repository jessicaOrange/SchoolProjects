'use strict';

var gapi = require('googleapis');

module.exports.executeScript = function (callback) {
	const scriptId = "";
	const func = "";
	const params = [];

	var resource = {};
	resource["function"] = func;

	if(params) {
		if(typeof params === "array") {
			resource["parameters"] = params;
		} else {
			resource["parameters"] = [params];
		}
	}

	gapi.client.script.scripts.run({
			'scriptId':scriptId,
			'resource':resource
		}).then(function(resp) {
		var result = resp.result;
		if(result.error && result.error.status) {
		  // The API encountered a problem before the script started executing.
		  callback({"error" : "Error calling API: " + JSON.stringify(resp, null, 2)});
		} else if(result.error) {
		  // The API executed, but the script returned an error.
		  var error = resp.error.details[0];
		  callback({"error" : "Error running Script: " + error.errorMessage});
		} else {
		  callback(result.response);
		}
	});
}