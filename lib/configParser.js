var fs = require("fs");
var vow = require("vow");
var promise = vow.promise();
var config = getConfig();

function getConfig() {
    fs.readFile('./config.json', function(err, data) {
        if (err) {
            throw err;
        }

        console.log('read');

        promise.fulfill(JSON.parse(data));
    });

    return promise;
}

function getParamByName(name) {
   return config.then(function(config) {
       return config[name];
   });
}

exports.get = getParamByName;
