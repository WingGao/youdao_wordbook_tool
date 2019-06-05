const ffmpeg = require('fluent-ffmpeg');
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const { Lang } = require('./ai/data')

function ffPromiseRun(c, endCb) {
    return new Promise((resolve, reject) => {
        c.on('error', function (err) {
            reject(err)
        }).on('end', function () {
            if (endCb != null) resolve(endCb())
            else resolve()
        }).run()
    })
}

class Parser {
    constructor(vpath, aiName, opt) {
        opt = _.merge({
            tempDir: path.resolve(__dirname, '../temp')
        }, opt)
        this.vpath = vpath
        this.tempDir = opt.tempDir
        let aic
        switch (aiName) {
            case Parser.AI_BAIDU:
                aic = require('./ai/baidu')
                break
            default:
                throw 'need aiName'
        }
        this.ai = new aic(Lang.HK)
        this.ffcmd = new ffmpeg(vpath)
    }

    info() {
        return new Promise(resolve => {
            ffmpeg.ffprobe(this.vpath, (err, metadata) => {
                console.log(require('util').inspect(metadata, false, null));
                resolve()
            });
        })
    }

    getAudio(idx = 0) {
        let outputFile = path.resolve(this.tempDir, '1.pcm')
        return ffPromiseRun(ffmpeg(this.vpath).audioFrequency(16000)
                .audioChannels(1)
                .duration(10)
                .format('s16le')
                .output(outputFile)
            , () => outputFile)
    }

    asrRecognize(fpath) {
        let voice = fs.readFileSync(fpath);
        let voiceBuffer = new Buffer(voice);
        return this.ai.asrRecognize(voiceBuffer)
    }
}

Parser = Object.assign(Parser, {
    AI_BAIDU: 'AI_BAIDU'
})

class VideoParser extends Parser {
    constructor(vpath) {
        super(vpath)
    }
}

class AudioParser extends Parser {
    constructor(vpath, aiName, opt) {
        super(vpath, aiName, opt)
    }
}

module.exports = {
    VideoParser,
    AudioParser
}
