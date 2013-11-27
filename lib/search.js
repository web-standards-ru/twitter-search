"use strict";

var redis = require('redis');
var twitter = require('twitter');
var redisClient = redis.createClient();
var configParser = require('./configParser');

redisClient.select(configParser.get("dbNum"));

var twit = new twitter({
    consumer_key: configParser.get('consumer_key'),
    consumer_secret: configParser.get('consumer_secret'),
    access_token_key: configParser.get('access_token_key'),
    access_token_secret: configParser.get('access_token_secret')
});

function search(q) {
    var util = require('util');

    twit.stream('filter', {
        'track': q
    }, function(stream) {
        stream.on('data', function(data) {
            if (configParser.get("retweet") === false && data.text.indexOf("RT ") === 0) {
                return;
            }

            redisClient.lpush('tweets', JSON.stringify(data));
        });
    });
}

exports.search = search;
