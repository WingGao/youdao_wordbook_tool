const path = require('path')
const fs = require('fs')
const Subtitle = require('subtitle')
const argv = require('yargs').argv
const _ = require('lodash')

function loadZidian() {
    let j = fs.readFileSync(path.resolve(__dirname, 'data/zidian.json'))
    return JSON.parse(j)
}

const wordMap = loadZidian()


function translateSrt(fname) {
    let srt = fs.readFileSync(fname, { encoding: 'utf-8' })
    let srtLines = Subtitle.parse(srt)
    srtLines.forEach(line => {
        let ypLines = []
        _.forEach(line.text, w => {
            let word = wordMap[w]
            if (word != null) {
                ypLines.push(word.yp)
                // return true
            }else {
                ypLines.push(w)
            }
            // return false
        })
        line.text = ypLines.join(' ') + '\n' + line.text
    })
    let newSrt = Subtitle.stringify(srtLines)
    fs.writeFileSync(fname.replace(/srt$/, 'yp.srt'), newSrt)
}


if (require.main === module) {
    translateSrt(argv.file)
}