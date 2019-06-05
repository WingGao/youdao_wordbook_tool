const { VideoParser, AudioParser } = require('./parser');
const path = require('path')

test('VideoParser', () => {
    let vp = new VideoParser('')
});

test('AudioParser', async () => {
    let parser = new AudioParser(path.resolve(__dirname, 'test/1.m4a'), 'AI_BAIDU')
    await expect(parser.info()).resolves.not.toBeNull()
    let pcm = await parser.getAudio()
    await expect(parser.asrRecognize(pcm).then(res => {
        require('util').inspect(res, false, null)
    })).resolves.toBeNull()
});
