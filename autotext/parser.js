const ffmpeg = require('fluent-ffmpeg');
const _ = require('lodash')
const path = require('path')

class Parser {
    constructor(vpath, opt) {
        opt = _.merge({
            tempDir: path.resolve(__dirname, '../temp')
        }, opt)
        this.vpath = vpath
        this.tempDir = opt.tempDir

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

    }
}

class VideoParser extends Parser {
    constructor(vpath) {
        super(vpath)
    }
}

class AudioParser extends Parser {
    constructor(vpath) {
        super(vpath)
    }
}

module.exports = {
    VideoParser,
    AudioParser
}
