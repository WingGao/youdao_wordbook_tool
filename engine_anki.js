const fetch = require('node-fetch')
const fs = require('fs');
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

const ANKI_HOST = 'http://localhost:8765'

const ANKI_NOTE_MODULES = {
    Basic: 'Basic'
}

// https://foosoft.net/projects/anki-connect/index.html#notes-for-mac-os-x-users
class AnkiNote {
    constructor(props) {
        this.deckName = null
        this.modelName = ANKI_NOTE_MODULES.Basic
        this.fields = {
            "Front": null,
            "Back": null,
        }
        this.options = {
            "allowDuplicate": false,
        }
        this.tags = []
        this.audio = null
    }

    addAudio(url, filename) {
        this.audio = {
            url: url,
            filename: filename,
            "fields": [
                "Back"
            ]
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

module.exports = {
    addNote, AnkiNote,
}