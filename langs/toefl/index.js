const { MdictClient } = require('../../engine_mdict')
const { addNote, AnkiNote, canAddAnki } = require('../../engine_anki')
const path = require('path')
const fs = require('fs')
const express = require('express')
const app = express()
const port = 7005

const notFound = []

async function main(wordbook) {
    let wb = fs.readFileSync(wordbook)
    let mdict = new MdictClient()
    wb = wb.toString('utf8')
    let wbs = wb.split('\n')
    for (let i = 0; i < wbs.length; i++) {
        console.log('>', i)
        let w = wbs[i].trim()
        if (w.length == 0) continue
        let wnote = new AnkiNote()
        wnote.deckName = 'Toefl'
        wnote.fields = {
            Front: w,
        }
        let canAdd = await canAddAnki(wnote)
        if (!canAdd) { //先粗略校验，因为lookup耗时
            console.log('skip', w)
            continue
        }
        let word = await mdict.lookup(w)
        if (word == null) {
            // throw `查不到 ${ w }`
            notFound.push(w)
            continue
        }
        if (!await addWord(word)) {
            console.log('skip', word.name)
            continue
        }
        for (let j = 0; j < word.pharas.length; j++) {
            let sw = word.pharas[j]
            await addWord(sw)
        }
        // debugger
    }

    // process.exit(0)
    console.log(notFound.length)
    debugger
}

async function addWord(word) {
    let note = new AnkiNote()
    note.deckName = 'Toefl'
    note.fields = {
        Front: word.name,
        Back: word.cn,
    }
    note.tags = word.tags
    if (word.audioUS && word.audioUS.f) {
        let fname = path.basename(word.audioUS.f)
        note.addAudio(`http://localhost:${ port }/temp/${ fname }`, fname)
    }
    let canAdd = await note.canAdd()
    if (canAdd) {
        let res = await note.addAnki()
        console.log('add anki', word.name, res)
        return true
    }
    return false
}

app.use(express.static(path.resolve(__dirname, '../../')));

setTimeout(() => {
    app.listen(port, () => console.log(`Example app listening on port ${ port }!`))

}, 1)
main(path.resolve(__dirname, 'data/托福词汇——只有单词.txt'))