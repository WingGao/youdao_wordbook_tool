const fetch = require('node-fetch')
const fs = require('fs');
const queryString = require('query-string');
const _ = require('lodash')
const parser = require('fast-xml-parser');
const { Book, Word } = require('./data')
const Config = require('./config')
const moment = require('moment');
const log4js = require('log4js');

const logger = log4js.getLogger();
logger.level = 'debug'

function postData(url, form, conf = {}) {
    conf = _.merge({
        headers: {
            'Content-Type': `application/x-www-form-urlencoded`
        }
    }, conf)
    return fetch(url, {
        method: 'POST',
        body: queryString.stringify(form),
        ...conf
    })
}

function postJson(url, obj, conf = {}) {
    conf = _.merge({
        headers: {
            'Content-Type': `application/json`
        }
    }, conf)
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(obj),
        ...conf
    }).then(res => res.json())
}

module.exports = {
    postData, postJson, logger,
}