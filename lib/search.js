"use strict";

var https = require('https');
var auth = require('./auth');
var redis = require('redis');
var authToken = auth.getToken();
var redisClient = redis.createClient();
var configParser = require('./configParser');

redisClient.select(configParser.get("dbNum"));

/**
 * Конструктор запроса к Search Api твиттера
 * @param q
 * @param refreshUrl
 * @param token
 * @returns {{method: string, host: string, path: string, headers: {Authorization: string}}}
 */
function getOptions(q, since_id, token) {
    var query = '?q=' + encodeURIComponent(q) + '&result_type=recent&include_entities=false&since_id=' + since_id;

    console.log(query);

    return {
        method: 'GET',
        host: 'api.twitter.com',
        path: '/1.1/search/tweets.json'  + query,
        headers: {
            Authorization: 'Bearer ' + token
        }
    };
}

/**
 * Возвращаем JSON с твитами от Twitter Api
 * @param {String|Object} q строка запроса
 * @param refreshUrl
 * @param {Function} callback функция обратного вызова
 */
function getTweets(q, refreshUrl, callback) {

    authToken.then(function(token) {
        var req = https.request(getOptions(q, refreshUrl, token), onRequest);
        req.end();
    });

    function onRequest(response) {
        var data = '';
        response.on('data', function(chunk) {
            data += chunk;
        });

        response.on('end', function () {
            callback({
                'code': response.statusCode,
                'data': data
            });
        });
    }
}

function search(q) {
    redisClient.get('max_id', function(err, result) {
        var since_id = result;

        setInterval(function() {
            getTweets(q, since_id, function(data) {
                var result = JSON.parse(data.data);
                since_id = result.search_metadata.max_id_str;
                redisClient.set('max_id', since_id);

                result.statuses.reverse().forEach(function(elem) {
                    if ('retweeted_status' in elem && !configParser.get('includeRetweets')) {
                        return;
                    }

                    redisClient.lpush('tweets', JSON.stringify(elem));
                });
            });
        }, configParser.get('pollInterval'));
    });
}

exports.getTweets = getTweets;
exports.search = search;
