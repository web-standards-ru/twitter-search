"use strict";

var https = require('https');
var fs = require('fs');
var Vow = require('vow');
var promise = Vow.promise();
var token;
var configPath = './config.json';
var config = getConfig(configPath);
var authOptions = {
    method: 'POST',
    host: 'api.twitter.com',
    path: '/oauth2/token',
    headers: {
        'Authorization': createAuthHeader(config),
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    }
};

/**
 * Читаем конфиг авторизации
 * @param {String} path путь до конфига
 * @returns {*}
 */
function getConfig(path) {
    return JSON.parse(fs.readFileSync(path, {encoding: "ascii"}));
}

/**
 * Формируем http-заголовок авторизации
 * @param params
 * @returns {string}
 */
function createAuthHeader(params) {
    var str = params.key + ":" + params.secret;
    var ret = new Buffer(str).toString('base64');
    return 'Basic ' + ret;
}

/**
 * Обработчик ответа от сервера
 *
 * Разрешаем promise значением токена
 * @param response
 */
function onRequest(response) {
    var result = "";
    response.on('data', function(chunk) {
        result += chunk;
    });

    response.on('end', function() {
        promise.fulfill(JSON.parse(result).access_token)
    });
}

/**
 * Получаем токен от Twitter Api
 * @returns {Vow.promise}
 */
function getToken() {
    var req = https.request(authOptions, onRequest);
    req.write('grant_type=client_credentials');
    req.end();

    return promise;
}

exports.getToken = getToken;
