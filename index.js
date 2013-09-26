"use strict";

var http = require('http');
var redis = require('redis');
var configParser = require('./lib/configParser');
var search = require('./lib/search');
var url = require('url');

var redisClient = redis.createClient();
var server = http.createServer();

redisClient.select(configParser.get('dbNum'));

server.on("request", function(req, res) {
    if (req.url === '/favicon.ico') {
        return;
    }

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    
    res.writeHead(200, {
        'access-control-allow-origin': '*',
        'content-type': 'application/json'
    });

    redisClient.lrange('tweets', 0, 20, function(err, data) {
        var responseData;
        var fields;
        var result = data.map(function(elem) {
            return JSON.parse(elem);
        });

        if ('fields' in query) {
            fields = query.fields.split(',');
            responseData = result.map(function(elem) {
                var ret = {};

                fields.forEach(function (field) {
                    var fieldObj; 

                    if(field.indexOf('.') === -1) {
                        ret[field] = elem[field];
                    } else {
                        fieldObj = field.split('.');
                        ret[fieldObj[0]] = ret[fieldObj[0]] || {};
                        ret[fieldObj[0]][fieldObj[1]] = elem[fieldObj[0]][fieldObj[1]]
                    }
                });

                return ret;
            });
        } else {
            responseData = result;
        }

        responseData = JSON.stringify(responseData);
        
        if ('callback' in query) {
            responseData = query.callback + '(' + responseData + ')';
        }

        res.write(responseData);
        res.end();
    });
});

search.search(configParser.get('defaultQuery'));
server.listen(configParser.get('port') || 8000);
