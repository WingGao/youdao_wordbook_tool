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
let isLogin = false

function login() {
    return req.get('https://www.maimemo.com/home/login').then(() => {
        return req.post('https://www.maimemo.com/auth/login', {
            form: {
                email: Config.maimemo.username,
                password: Config.maimemo.password,
            }
        })
    })
}

function checkLogin() {
    return req.get('https://www.maimemo.com/').then(res => {
        if (res.indexOf('/auth/logout') > 0) {
            isLogin = true
        } else {
            isLogin = false
        }
        return isLogin
    })
}

/**
 * 获取墨墨的单词本
 * @param id
 * @returns {PromiseLike<{content: string | DocumentFragment, words: any[]}> | Promise<{content: string | DocumentFragment, words: any[]}>}
 */
function getMaimemoBook(id = Config.maimemo.bookid) {
    // https://www.maimemo.com/res/editor/index.html?_version=6&notepadId=5c8910a8e1968951ce861fe1
    return req(`https://www.maimemo.com/api/v1/notepads/${id}?token=`, {
        json: true
    }).then(res => {
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

/**
 * 获取墨墨所有的个人单词本
 * @returns {PromiseLike<T | never> | Promise<T | never>}
 */
function getAllBooks() {
    return req.get('https://www.maimemo.com/api/v1/notepads/default?favorite=0&content=0&token=', { json: true }).then(res => {
        return res.data
    })
}

function saveBook(bookHash, content) {
    // let bookHash = '5c8910a8e1968951ce861fe1'
    return req.post(`https://www.maimemo.com/api/v1/notepads/${bookHash}?token=`, {
        body: {
            notepad: {
                content,
                is_private: 1,
                version: 0,
            },
            publish: true,
        },
        json: true,
    })
}

/**
 * 将有道单词本同步到墨墨的单词本 bookid
 * 只同步墨墨有的单词，目前墨墨不支持自定义单词内容
 * 将墨墨没有的单词重新移动到另一个有道单词表 noresulttag
 * @param {Book} myBook
 * @param {number} tobookid 需要导入的墨墨单词本id
 * @returns {Promise<void>}
 */
async function buildMaimemo(myBook, tobookid) {
    if (!isLogin) {
        await login()
        await checkLogin()
    }
    // 获取墨墨的词库hashId
    let allBooksInfo = await getAllBooks()
    let bookHash = allBooksInfo.notepads.find(v => v.notepad_id == tobookid)
    if (bookHash == null) {
        throw `墨墨没有该词库${tobookid}`
    }
    bookHash = bookHash.id
    //检测墨墨里有没有
    let maimemoBook = await getMaimemoBook(tobookid)
    let newWords = _.map(myBook.words, v => {
        if (maimemoBook.words.indexOf(v.name) >= 0) {
            v.maimemoOld = true
        }
        return v
    }).filter(v => !v.maimemoOld)
    // 检测墨墨是否有该单词
    let maimeoExists = await req.post('https://www.maimemo.com/api/v1/vocabulary/check_exists?token=', {
        body: {
            spellings: newWords.map(v => v.name)
        },
        json: true,
    })
    // 这些是新词
    let words = _.values(myBook.words).filter(v => !v.maimemoOld)
    logger.info('新词', words.length, '个')
    let newwords_in_maimemo = []
    let newwords_notin_maimemo = []
    for (let i = 0; i < words.length; i++) {
        let word = words[i]
        if (maimeoExists.data.exists.indexOf(word.name) >= 0) {
            word.maimemoExist = true
            newwords_in_maimemo.push(word)
        } else {
            logger.info('fetch ', word.name)
            newwords_notin_maimemo.push(word)
            // 先要获取释义，再移动
            let t = new Date().getTime()
            // await getYoudaoWord(word.name).then(res => {
            //     word.youdaoData = res
            //     // console.log(word.toMaimemo())
            // })
            // 移动单词
            // if (Config.youdao.noresulttag) {
            //     await postData(`http://dict.youdao.com/wordbook/api?keyfrom=mac.main&id=80:E6:50:00:E4:EE&model=MacBookPro11,2&deviceid=C02N62Q0G3QC&mid=Mac%20OS%20X%2010.13.6&requestNum=2000`, {
            //         data: `<?xml version="1.0" encoding="utf-8" ?><request><type>words</type><operation>commit</operation><maxLocalTimestamp>${youdaoBookInfo.maxServerTimestamp}</maxLocalTimestamp><maxRemLocalTimestamp>${youdaoBookInfo.maxRemServerTimestamp}</maxRemLocalTimestamp>
            //     <actionlist><action type="add"><word><![CDATA[${word.name}]]></word><wordInfo>
            //     <phonetic><![CDATA[]]></phonetic><trans><![CDATA[${word.getCn()}]]></trans>
            //     <tags><![CDATA[;${Config.youdao.noresulttag}]]></tags><addtime>${Math.round(t / 1000)}</addtime>
            //     <flag>1</flag></wordInfo></action></actionlist></request>`,
            //         version: 2,
            //     }, { headers: { Cookie: Config.youdao.cookie } }).then(res => res.text()).then(res => {
            //         let jsonObj = parser.parse(res)
            //         youdaoBookInfo.maxServerTimestamp = jsonObj.response.maxServerTimestamp
            //         youdaoBookInfo.maxRemServerTimestamp = jsonObj.response.maxRemServerTimestamp
            //         // debugger
            //     })
            // }
        }
    }
    logger.info('保存单词本', tobookid, '...')
    let wordsExist = words.filter(v => v.maimemoExist)
    let wordsNotExist = words.filter(v => !v.maimemoExist)
    const flag1 = '//===wing word==='
    const flag2 = '//===wing body==='
    //备份
    fs.writeFileSync(`backup/m${tobookid}_${moment().format('YYYYMMDD_HHmmss')}.txt`, maimemoBook.content)
    // 插入已存在的
    let bookTxt = maimemoBook.content.replace(flag1, wordsExist.map(v => v.name).join('\n') + '\n' + flag1)
    // 插入不存在的
    bookTxt = bookTxt.replace(flag2, wordsNotExist.map(v => v.name).join('\n') + '\n' + flag2)
    // 插入自定义内容
    bookTxt = bookTxt.replace(flag2, flag2 + '\n' + wordsNotExist.map(v => v.toMaimemo()).join('\n'))
    fs.writeFileSync(`m_${tobookid}.txt`, bookTxt)
    //保存到墨墨
    logger.info('保存到墨墨', bookHash)
    let saveRes = await saveBook(bookHash, bookTxt)
    logger.info('success:', saveRes.success, 'errors:', saveRes.errors)
    return {
        newwords: words, // 新添加到墨墨的单词
        newwords_in_maimemo,//默默里有的新词
        newwords_notin_maimemo,//默默里没有的新词
    }
}

module.exports = {
    getMaimemoBook, buildMaimemo,
}