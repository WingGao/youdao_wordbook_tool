const fetch = require('node-fetch')
const fs = require('fs');
const queryString = require('query-string');
const _ = require('lodash')
const parser = require('fast-xml-parser');
const { Book, Word } = require('./data')
const Config = require('./config')
const moment = require('moment');

function postData(url, form, conf = {}) {
    conf = _.merge({
        headers: {
            'Content-Type': `application/x-www-form-urlencoded`
        }
    }, conf)
    return fetch(url, {
        method: 'POST',
        body: queryString.stringify(form),
        ...conf
    })
}

function postJson(url, obj, conf = {}) {
    conf = _.merge({
        headers: {
            'Content-Type': `application/json`
        }
    }, conf)
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(obj),
        ...conf
    }).then(res => res.json())
}


function getYoudaoWord(wordEn) {
    return fetch(`http://dict.youdao.com/jsonapi?q=${encodeURIComponent(wordEn)}&doctype=json&keyfrom=mac.main&id=92EAC020C265501643DB359450E87E0E&vendor=cidian.youdao.com&appVer=2.3.3&client=macdict&jsonversion=2`, {
        headers: { Cookie: Config.youdao.cookie }
    }).then(res => res.json())
}

function getMaimemoBook(id = Config.maimemo.bookid) {
    return fetch(`https://www.maimemo.com/api/v1/notepads/${id}?token=`, {
        headers: { Cookie: Config.maimemo.cookie }
    }).then(res => res.json()).then(res => {
        let words = res.data.notepad.content.split('\n').map(line => {
            if (/^[a-zA-Z]/g.test(line)) {
                return line.trim(/{/ig)
            }
            return null
        }).filter(v => v != null)
        return {
            content: res.data.notepad.content,
            words,
        }
    })
}

async function buildMaimemo() {
    //检测墨墨里有没有
    let maimemoBook = await getMaimemoBook()
    let newWords = _.map(myBook.words, v => {
        if (maimemoBook.words.indexOf(v.name) >= 0) {
            v.maimemoOld = true
        }
        return v
    }).filter(v => !v.maimemoOld)

    let maimeoExists = await postJson('https://www.maimemo.com/api/v1/vocabulary/check_exists?token=', {
        spellings: newWords.map(v => v.name)
    }, {
        headers: { Cookie: Config.maimemo.cookie }
    })
    let words = _.values(myBook.words).filter(v => !v.maimemoOld)
    for (let i = 0; i < words.length; i++) {
        let word = words[i]
        if (maimeoExists.data.exists.indexOf(word.name) >= 0) {
            word.maimemoExist = true
        } else {
            console.log('fetch ', word.name)
            // 移动到cfa-mo
            let t = new Date().getTime()
            await getYoudaoWord(word.name).then(res => {
                word.youdaoData = res
                // console.log(word.toMaimemo())
            })
            await postData(`http://dict.youdao.com/wordbook/api?keyfrom=mac.main&id=80:E6:50:00:E4:EE&model=MacBookPro11,2&deviceid=C02N62Q0G3QC&mid=Mac%20OS%20X%2010.13.6&requestNum=2000`, {
                data: `<?xml version="1.0" encoding="utf-8" ?><request><type>words</type><operation>commit</operation><maxLocalTimestamp>${youdaoBookInfo.maxServerTimestamp}</maxLocalTimestamp><maxRemLocalTimestamp>${youdaoBookInfo.maxRemServerTimestamp}</maxRemLocalTimestamp>
                <actionlist><action type="add"><word><![CDATA[${word.name}]]></word><wordInfo>
                <phonetic><![CDATA[]]></phonetic><trans><![CDATA[${word.getCn()}]]></trans>
                <tags><![CDATA[;${Config.youdao.noresulttag}]]></tags><addtime>${Math.round(t / 1000)}</addtime>
                <flag>1</flag></wordInfo></action></actionlist></request>`,
                version: 2,
            }, { headers: { Cookie: Config.youdao.cookie } }).then(res => res.text()).then(res => {
                let jsonObj = parser.parse(res)
                youdaoBookInfo.maxServerTimestamp = jsonObj.response.maxServerTimestamp
                youdaoBookInfo.maxRemServerTimestamp = jsonObj.response.maxRemServerTimestamp
                // debugger
            })

        }
    }
    console.log('save...')
    let output = words.filter(v => v.maimemoExist).map(v => v.name).join('\n')
    const flag = '//===wing==='
    fs.writeFileSync(`backup/m${Config.maimemo.bookid}_${moment().format('YYYYMMDD_HHmmss')}.txt`, maimemoBook.content)
    let bookTxt = maimemoBook.content.replace(flag, output + '\n' + flag)
    // output = words.filter(v => !v.maimemoExist).map(v => v.toMaimemo()).join('\n')
    // bookTxt = bookTxt.replace(flag, flag + '\n' + output + '\n')
    fs.writeFileSync(`m_${Config.maimemo.bookid}.txt`, bookTxt)
}

async function buildMyBook() {
    let books = {}
    postData('http://dict.youdao.com/wordbook/api?keyfrom=mac.main&id=80:E6:50:00:E4:EE&model=MacBookPro11,2&deviceid=C02N62Q0G3QC&mid=Mac%20OS%20X%2010.13.6&requestNum=2000', {
        version: 2,
        data: `<?xml version="1.0" encoding="utf-8" ?><request><type>words</type><operation>update</operation><maxLocalTimestamp>0</maxLocalTimestamp><maxRemLocalTimestamp>${new Date().getTime()}</maxRemLocalTimestamp></request>`,
    }, {
        headers: {
            Cookie: Config.youdao.cookie
        }
    }).then(res => {
        return res.text()
    }).then(res => {

        let jsonObj = parser.parse(res)
        console.log(jsonObj)

        jsonObj.response.actionlist.action.forEach(action => {
            let book = books[action.tags]
            if (book == null) {
                book = new Book()
                book.name = action.tags
                books[action.tags] = book
            }
            book.addWord(action.word)
        })
        myBook = books[Config.youdao.unchecktag]
        youdaoBookInfo.maxServerTimestamp = jsonObj.response.maxServerTimestamp
        youdaoBookInfo.maxRemServerTimestamp = jsonObj.response.maxRemServerTimestamp
        buildMaimemo()
    })
}

// 有道单词表验证时间戳
let youdaoBookInfo = {
    maxServerTimestamp: 0,
    maxRemServerTimestamp: 0,
}

let myBook
buildMyBook()