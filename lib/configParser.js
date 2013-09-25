var fs = require("fs");
var config = JSON.parse(fs.readFileSync('./config.json'));

function getParamByName(name) {
    return config[name];
}

exports.get = getParamByName;
