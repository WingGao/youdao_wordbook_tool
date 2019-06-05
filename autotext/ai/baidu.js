const Config = require('../../config')
const AipSpeechClient = require('baidu-aip-sdk').speech;
const HttpClient = require('baidu-aip-sdk').HttpClient;
const client = new AipSpeechClient(Config.autotext.baidu.APP_ID,
    Config.autotext.baidu.API_KEY, Config.autotext.baidu.SECRET_KEY);

