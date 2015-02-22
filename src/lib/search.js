"use strict";

var redis = require("redis");
var twitter = require("twitter");
var redisClient = redis.createClient();
var configParser = require("./configParser");
var logging = require("./logging");
var logger = new logging.Logger(configParser.get("logging"));

redisClient.select(configParser.get("dbNum"));

var twit = new twitter({
    consumer_key: configParser.get("consumer_key"),
    consumer_secret: configParser.get("consumer_secret"),
    access_token_key: configParser.get("access_token_key"),
    access_token_secret: configParser.get("access_token_secret")
});

function search(q) {
    twit.stream("filter", {
        "track": q
    }, function(stream) {
        logger.log("Stream started on " + (new Date()), "Twitter stream started");
        
        stream.on("data", function(data) {
            if (configParser.get("retweet") === false && data.text.indexOf("RT ") === 0) {
                return;
            }

            redisClient.lpush("tweets", JSON.stringify(data));
        });

        stream.on("end", function(request) {
            logger.log("Stream closed on " + (new Date()) + "with code" + request.statusCode, 
                "Twitter stream closed");

            stream.destroy();
            setTimeout(function() {
                search(q);
            }, 500);

        });

        stream.on("error", function(error) {
            logger.log("Stream error on " + (new Date()) + " with error " + error, 
                "Twitter stream started");

            stream.destroy();
            setTimeout(function() {
                search(q);
            }, 500);
        });
    });
}

exports.search = search;
