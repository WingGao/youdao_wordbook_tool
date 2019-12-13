const fetch = require('node-fetch')
const os = require('os');
const fs = require('fs');
const path = require('path');
const queryString = require('query-string');
const _ = require('lodash')
const parser = require('fast-xml-parser');
const { Book, Word } = require('./data')
const Config = require('./config')
const moment = require('moment');
const utils = require('./utils')
const { logger } = utils
const rp = require('request-promise-native')
const Mdict = require("js-mdict").default



const req = rp.defaults({
    // proxy: 'http://localhost:8888',
    jar: true
})

const ANKI_HOST = 'http://localhost:8765'

const ANKI_NOTE_MODULES = {
    Basic: 'Basic',
    BasicSound: 'BasicSound',
}
const ANKI_DIR = {
    'darwin': path.join(os.homedir(), 'Library/Application Support/Anki2/User 1'),
}[os.platform()]//.replace(/(\s+)/g, '\\$1')

// https://foosoft.net/projects/anki-connect/index.html#notes-for-mac-os-x-users
class MdictClient {
    constructor(dict_path) {
        this.path = dict_path
        this.mdict = new Mdict(dict_path);
    }

    load() {

        // 检查媒体文件
        let isOk = fs.existsSync(path.join(ANKI_DIR, 'collection.media', filename))
        if (isOk) {
            this.fields.Sound += ` [sound:${filename}]`
        } else {
            this.audio = {
                url: url,
                filename: filename,
                "fields": [
                    "Sound"
                ]
            }
        }
    }

    canAdd() {
        return req.post(ANKI_HOST, {
            body: {
                "action": "canAddNotes",
                "version": 6,
                "params": {
                    "notes": [this]
                },
            },
            json: true,
        }).then(res => {
            return res.result[0]
        })
    }
}

/*
audio = {
                "url": "https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=猫&kana=ねこ",
                "filename": "yomichan_ねこ_猫.mp3",
                "skipHash": "7e2c2f954ef6051373ba916f000168dc",
                "fields": [
                    "Front"
                ]
            }
 */


function addNote(note) {
    return req.post(ANKI_HOST, {
        body: {
            "action": "addNote",
            "version": 6,
            "params": {
                "note": note
            }
        },
        json: true,
    })
}



function test() {
    let client =new MdictClient('/Volumes/D/DevEnvs/dicts/牛津高阶第九版 v3.1.2/牛津高阶双解(第9版)_V3.1.2版.mdx')
}
test()

module.exports = {
    // addNote, AnkiNote,
}