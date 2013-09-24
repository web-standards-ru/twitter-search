"use strict";

var https = require('https');
var auth = require('./auth');
var redis = require('redis');
var authToken = auth.getToken();
var redisClient = redis.createClient();

redisClient.select(1);

/**
 * Формируем ответ об ошибке
 * @param {Number} statusCode http-код ответа
 * @param {String} message текстовое представление ошибки
 * @param {Number} [code] код ошибки
 * @returns {{code: Number, data: {}}}
 */
function sendError(statusCode, message, code) {
    var data = {
        errors: [{
            message: message,
            code: code || 666
        }]
    };
    return {
        code: statusCode,
        data: JSON.stringify(data)
    };
}

/**
 * Конструктор запроса к Search Api твиттера
 * @param q
 * @param refreshUrl
 * @param token
 * @returns {{method: string, host: string, path: string, headers: {Authorization: string}}}
 */
function getOptions(q, refreshUrl, token) {
    var query = refreshUrl || '?q=' + encodeURIComponent(q) + '&result_type=recent';

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
//    if (typeof q !== 'string') {
//        callback(sendError(400, "Param q must be set and must be a string"));
//        return;
//    }
//
//    if (q.length === 0) {
//        callback(sendError(400, "Param 'q' must be a non empty string"));
//        return;
//    }

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

function run(q) {
    var refreshUrl = null;

    setInterval(function() {
        getTweets(q, refreshUrl, function(data) {
            var result = JSON.parse(data.data);
            refreshUrl = result.search_metadata.refresh_url;

            result.statuses.forEach(function(elem) {
                redisClient.lpush('tweets', JSON.stringify(elem));
            });
        });
    }, 1000);
}

exports.getTweets = getTweets;
exports.run = run;
