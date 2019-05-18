const json5 = require('json5')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const { logger } = require('../../utils')
const UtfString = require('utfstring');
const { addNote, AnkiNote } = require('../../engine_anki')
const rp = require('request-promise-native')
const request = require('request')
const Config = require('../../config')
const crypto = require('crypto')
const express = require('express');

class CantoneseWord {
    constructor(props) {
        this.name = null // 单字
        this.yp = null // 粤拼
        this.simple = null // 简体字
        this.tradiction = null // 繁体
    }
}

class CantonesePhrase {
    constructor() {
        this.name = null
        this.words = null
        this.yp = null
        this.mean = null
    }

    getName() {
        return _.map(this.words, v => v.name).join('')
    }
}

function parseDict(fname) {
    let dictTxt = fs.readFileSync(fname)
    let dictArray = json5.parse(dictTxt)
    // dictArray = _.shuffle(dictArray)
    // 尽可能少的全覆盖单字
    let wordMap = new Map()
    let flagSameWordMax = 0 // 最大相同单字数
    let dictPhraseArray = []
    let ypRe = /^[a-z]+\d$/i
    let zhRe = /[\u4e00-\u9fa5]/
    for (let i = 0; i < dictArray.length; i++) {
        let ph = new CantonesePhrase()
        let wordStr = dictArray[i]
        ph.name = wordStr
        // 不经一事，不长一智
        // 巢咪𠵼
        // 挐
        if (wordStr === '') {
            debugger
        }
        if (ypRe.test(wordStr)) {
            debugger
        } else if (/[\w\[]/.test(wordStr)) {
            // 类似 "亚sir", "aa3", "soe4", "长官，警官，先生，老师，男老师，男上司" 这样的结果
            // 直接跳过
            let skipLen = 1;
            for (; skipLen < 10; skipLen++) {
                // 类似 "亚sir", "aa3", "soe4", "长官，警官，先生，老师，男老师，男上司" 这样的结果
                let cw = dictArray[i + skipLen]
                if (!ypRe.test(cw)) {
                    break //找到解释
                }
            }
            i = i + skipLen
            logger.info('跳过', wordStr)
            continue
        }
        let sameLen = 0
        // 去掉非中文
        let wordCn = wordStr.replace(/[，…！〜？]/g, '')
        let wordLen = UtfString.visual.length(wordCn)
        let ww = UtfString.stringToCharArray(wordCn)
        if (ww) {
            //
        }
        let words = _.map(ww, v => {
            if (wordMap.has(v)) {
                sameLen++
            }
            let w = new CantoneseWord()
            w.name = v
            return w
        })
        i += 1
        let ypArr = []
        for (let j = 0; j < 20; j++) {
            // "卅", "saa1", "aa6"
            let yp = dictArray[i + j]
            if (ypRe.test(yp)) {
                ypArr.push(yp)
            } else {
                break
            }
        }
        let ignore = false
        if (ypArr.length === words.length) {
            for (let k = 0; k < ypArr.length; k++) {
                words[k].yp = ypArr[k]
            }
        } else {
            //TODO 一字多音
            ignore = true
        }
        ph.words = words
        // 检测释义
        let ypLen = ypArr.length
        let nextWordName = dictArray[i + ypLen + 1]
        let nextWordYp = dictArray[i + ypLen + 2]
        if (!ypRe.test(nextWordName) && ypRe.test(nextWordYp)) {
            // 有释义
            ph.mean = dictArray[i + ypLen]
            i += ypLen
        } else {
            i += ypLen - 1
        }
        if (ignore) {
            logger.info('跳过', wordStr)
        } else {
            dictPhraseArray.push(ph)
        }
        // logger.info('添加单词', wordStr)
    }
    return dictPhraseArray
}

// let words = parseDict(path.resolve(__dirname, 'data/cidian_zhyue-jt-kfcd-yp-2018620.txt'))
// fs.writeFileSync(path.resolve(__dirname, 'data/cidian.json'), json5.stringify(words))

function parseDictZidian(fname) {
    let dictTxt = fs.readFileSync(fname)
    let dictArray = json5.parse(dictTxt)
    let wordMap = {}
    for(let i=0;i<dictArray.length;i++){
        let word = new CantoneseWord()
        word.simple = dictArray[i]
        i++
        word.tradiction = dictArray[i]
        i++
        word.yp = dictArray[i]
        wordMap[word.simple] = word
        wordMap[word.tradiction] = word
    }
    return wordMap
}

let words = parseDictZidian(path.resolve(__dirname, 'data/zidian_zhyue-jt-kfcd-yp-2018620.txt'))
fs.writeFileSync(path.resolve(__dirname, 'data/zidian.json'), JSON.stringify(words))


function loadDict(fname, option = { checkChar: false, }) {
    let dictTxt = fs.readFileSync(fname)
    let dictArray = json5.parse(dictTxt)
    dictArray = _.shuffle(dictArray)
    // 尽可能少的全覆盖单字
    let wordMap = new Map()
    let flagSameWordMax = 5 // 最大相同单字数
    let dictPhraseArray = []
    for (let maxLen = 0; maxLen < flagSameWordMax; maxLen++) {
        for (let i = 0; i < dictArray.length; i++) {
            let ph = _.merge(new CantonesePhrase(), dictArray[i])
            let wordSameLen = 0
            for (let j = 0; j < ph.words.length; j++) {
                let word = ph.words[j]
                if (wordMap.has(word.name)) {
                    wordSameLen += 1
                }
            }
            if (ph.words.length === 1 && maxLen < flagSameWordMax - 1) { // 在最后一轮才允许添加单个字
                continue
            }
            if (wordSameLen === ph.words.length) { //去除覆盖单词
                dictArray[i] = null
            } else if (wordSameLen <= maxLen) { //允许添加
                dictPhraseArray.push(ph)
                ph.words.forEach(v => wordMap.set(v.name, 1))
                logger.info('添加单词', ph.getName())
                dictArray[i] = null
            }
        }
        dictArray = dictArray.filter(v => v != null)
        if (dictArray.length === 0) {
            break
        }
    }
    return dictPhraseArray
}

// let words2 = loadDict(path.resolve(__dirname, 'data/cidian.json'))
// fs.writeFileSync(path.resolve(__dirname, 'dis_cidiian.json'), json5.stringify(words2))

function downloadAudioXf(text, fname) {
    if (fname == null) fname = path.resolve(__dirname, `sounds/${text}.mp3`)
    if (fs.existsSync(fname)) {
        return Promise.resolve(true)
    }
    let xParam = {
        auf: 'audio/L16;rate=16000',
        aue: 'lame', //mp3
        voice_name: 'x_xiaomei', //粤语
        "speed": "30",
        "volume": "70",
        "pitch": "50",
        "engine_type": "intp65",
        "text_type": "text"
    }
    let xParamBase = JSON.stringify(xParam)
    xParamBase = new Buffer.from(xParamBase).toString('base64')
    let { appid, appkey } = Config.xunfei.apps[0]
    let ct = Math.floor(new Date().getTime() / 1000)
    const md5 = crypto.createHash('md5');
    let checksum = md5.update(appkey + ct + xParamBase).digest('hex')
    return new Promise(resolve => {
        logger.info('下载语音', text)
        let req1 = request.post('https://api.xfyun.cn/v1/service/v1/tts', {
            form: {
                text,
            },
            headers: {
                'X-Appid': appid,
                'X-CurTime': ct,
                'X-Param': xParamBase,
                'X-CheckSum': checksum,
            },
        })
        let haserr = false
        req1.on('response', function (response) {
            let ctype = response.headers['content-type']
            if (response.statusCode != 200 || ctype != 'audio/mpeg') {
                // console.log(response.statusCode) // 200
                // console.log(response.headers['content-type']) // 'image/png'
                const chunks = [];
                response.on("data", function (chunk) {
                    chunks.push(chunk);
                });

                // Send the buffer or you can put it into a var
                response.on("end", function () {
                    let srt = Buffer.concat(chunks).toString()
                    req1.emit('error', srt)
                });
                // response.read()
                debugger
            } else {
                response.pipe(fs.createWriteStream(fname))
            }
        }).on('end', () => {
            resolve(true)
        }).on('error', (err) => {
            // console.log(err)
            req1.pause()
            haserr = true
            resolve(err)
        })
    })
}

async function buildAnki(fname, deckName) {
    if (deckName == null) return
    let phArrayTxt = fs.readFileSync(fname)
    let phArray = json5.parse(phArrayTxt)
    let proArr = []
    logger.info('总单词', phArray.length)
    let beginIndex = 0
    for (let i = beginIndex; i < phArray.length; i++) {
        let ph = phArray[i]
        let note = new AnkiNote()
        note.deckName = deckName
        note.fields.Front = ph.name
        let canAdd = await note.canAdd()
        if (!canAdd) {
            // 已存在
            logger.info('跳过', i, ph.name)
            continue
        }

        note.fields.Sound = ph.words.map(v => v.yp).join(' ')
        note.fields.Back = (ph.mean == null ? '' : ph.mean)
        note.addAudio(`http://localhost:3000/loc/sounds/${ph.name}.mp3`, `yy1_${ph.name}.mp3`)
        let a1 = await downloadAudioXf(ph.name)
        if (a1 === true) {
            let res = await addNote(note)
            if (res.error != null) {
                if (res.error == 'cannot create note because it is a duplicate') {
                    continue
                }
                logger.error(i, ph.name, res.error)
                debugger
                return
            }
            logger.info('添加anki', i, ph.name, res.result)
        } else {
            logger.info('没有语音', i, ph.name, a1)
        }
    }
}

function main() {
    let app = express()
    app.use('/loc', express.static(path.resolve(__dirname)))
    app.listen(3000, () => {
        buildAnki(path.resolve(__dirname, 'dis_cidiian.json'), '粤语1') // 初级
    })
}

module.exports = {
    CantoneseWord,
}
