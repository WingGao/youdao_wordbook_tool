const { VideoParser, AudioParser } = require('./parser');
const path = require('path')

test('VideoParser', () => {
    let vp = new VideoParser('')
});

test('AudioParser', async () => {
    let parser = new AudioParser(path.resolve(__dirname, 'test/1.m4a'))
    await expect(parser.info()).resolves.nul
});