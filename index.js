var http = require('http');
var redis = require('redis');
var configParser = require('./lib/configParser');
var search = require('./lib/search');

var redisClient = redis.createClient();
var server = http.createServer();

redisClient.select(1);

server.on("request", function(req, res) {
    if (req.url === '/favicon.ico') {
        return;
    }
    res.writeHead(200, {
        'access-control-allow-origin': '*',
        'content-type': 'application/json'
    });

    redisClient.lrange('tweets', 0, 20, function(err, data) {
        res.write('[' + data.reverse().join(',') + ']');
        res.end();
    });
});

configParser.get('defaultQuery').then(function(query) {
    search.run(query);
});

configParser.get('port').then(function(port) {
    server.listen(port);
});
