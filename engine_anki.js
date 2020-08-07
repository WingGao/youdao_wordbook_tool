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

const req = rp.defaults({
    // proxy: 'http://localhost:8888',
    jar: true
})

const ANKI_HOST = 'http://localhost:18765'

const ANKI_NOTE_MODULES = {
    Basic: 'Basic',
    BasicSound: 'BasicSound',
    Ox9: 'Ox9',
}
const ANKI_DIR = {
    'darwin': path.join(os.homedir(), 'Library/Application Support/Anki2/User 1'),
}[os.platform()]//.replace(/(\s+)/g, '\\$1')

// https://foosoft.net/projects/anki-connect/index.html#notes-for-mac-os-x-users
// 设置端口 18765
class AnkiNote {
    constructor(props) {
        this.deckName = null
        this.modelName = ANKI_NOTE_MODULES.Ox9
        this.fields = {
            'Front': null,
            'Back': null,
            'Sound': undefined,
        }
        this.options = {
            'allowDuplicate': false,
        }
        this.tags = []
        this.audio = null
    }

    // 需要开启http服务
    addAudio(url, filename) {
        // 检查媒体文件
        let isOk = fs.existsSync(path.join(ANKI_DIR, 'collection.media', filename))
        if (isOk) {
            this.fields.Sound += ` [sound:${ filename }]`
        } else {
            this.audio = {
                url: url,
                filename: filename,
                'fields': [
                    'Sound'
                ]
            }
        }
    }

    canAdd() {
        return canAddAnki(this)
    }

    addAnki() {
        return addNote(this)
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

function canAddAnki(note) {
    return req.post(ANKI_HOST, {
        body: {
            'action': 'canAddNotes',
            'version': 6,
            'params': {
                notes: [note]
            },
        },
        json: true,
    }).then(res => {
        return res.result[0]
    })
}

function addNote(note) {
    return req.post(ANKI_HOST, {
        body: {
            'action': 'addNote',
            'version': 6,
            'params': {
                'note': note
            }
        },
        json: true,
    })
}

module.exports = {
    addNote, canAddAnki, AnkiNote,
}
