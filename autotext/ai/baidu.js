const Config = require('../../config')
const AipSpeechClient = require('baidu-aip-sdk').speech;
const HttpClient = require('baidu-aip-sdk').HttpClient;
// https://ai.baidu.com/docs#/ASR-Online-Node-SDK/top
const { Lang } = require('./data')
const client = new AipSpeechClient(Config.autotext.baidu.APP_ID,
    Config.autotext.baidu.API_KEY, Config.autotext.baidu.SECRET_KEY);

class AiBaidu {
    constructor(lang) {
        this.lang = {
            [Lang.HK]: 1637,
        }[lang]
    }

    asrRecognize(buff) {
        return client.recognize(buff, 'pcm', 16000, { dev_pid: this.lang })
    }
}

module.exports = AiBaidu