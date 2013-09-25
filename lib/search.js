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
function getOptions(q, refreshUrl, token) {
    var query = refreshUrl || '?q=' + encodeURIComponent(q) + '&result_type=recent&include_entities=false';

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
    var refreshUrl = redisClient.get('refreshUrl');

    setInterval(function() {
        getTweets(q, refreshUrl, function(data) {
            var result = JSON.parse(data.data);
            refreshUrl = result.search_metadata.refresh_url;
            redisClient.set('refreshUrl', refreshUrl);

            result.statuses.reverse().forEach(function(elem) {
                if ('retweeted_status' in elem && !configParser.get('includeRetweets')) {
                    return;
                }

                redisClient.lpush('tweets', JSON.stringify(elem));
            });
        });
    }, configParser.get('pollInterval'));
}

exports.getTweets = getTweets;
exports.search = search;
