const { VideoParser, AudioParser } = require('./parser');
const path = require('path')

async function main() {
    let parser = new AudioParser(path.resolve(__dirname, 'test/1.m4a'), 'AI_BAIDU')
    let pcm = await parser.getAudio()
    await parser.asrRecognize(pcm).then(res => {
        console.log(res)
    }, err => {
        console.log(err)
    })
}

main()