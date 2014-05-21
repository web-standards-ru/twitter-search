var fs = require("fs");
var path = require("path");
var configFile = path.resolve(__dirname, '../config.json');
var config = JSON.parse(fs.readFileSync(configFile));

function getParamByName(name) {
    return config[name];
}

exports.get = getParamByName;
