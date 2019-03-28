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
const { Engine } = require('./engine')
const Maimemo = require('./engine_maimemo')
const crypto = require('crypto')
const md5 = crypto.createHash('md5');

class Youdao extends Engine {
    constructor(props) {
        super('有道');
        this.config = Config.youdao
        this.config.to_maimemo_bookid = _.defaultTo(this.config.to_maimemo_bookid, Config.maimemo.bookid)
        this.reqConfig = _.merge({}, this.reqConfig, {
            headers: {
                'User-Agent': 'youdao 2.3.4 rv:161 (Macintosh; Mac OS X 10.14.2; zh_CN)',
            },
        })
        this.books = {}
        // 有道单词表验证时间戳
        this.maxServerTimestamp = 0
        this.maxRemServerTimestamp = 0
    }

    login() {
        if (_.size(this.config.username) > 0) {
            // 初始化cookie
            return this.req.get('http://fanyi.youdao.com/?keyfrom=dict2.index').then(() => {
                return this.req.get(`https://dict.youdao.com/login/acc/login?app=client&product=DICT&tp=urstoken&cf=7&show=true&format=json&` +
                    `username=${this.config.username}&password=${md5.update(this.config.password).digest('hex')}&um=true`, { json: true }
                ).then(res => {
                    super.login()
                    logger.info(this.name, '用户登录', res.username)
                })
            })
        }
    }

    getWords(page = 0, all = false) {
        let books = {}
        // 获取有道单词本
        //TODO 超过2000的时候怎么办？
        return this.req.post('http://dict.youdao.com/wordbook/api?keyfrom=mac.main&id=80:E6:50:00:E4:EE&model=MacBookPro11,2&deviceid=C02N62Q0G3QC&mid=Mac%20OS%20X%2010.13.6&requestNum=2000', {
            form: {
                version: 2,
                data: `<?xml version="1.0" encoding="utf-8" ?><request><type>words</type><operation>update</operation><maxLocalTimestamp>0</maxLocalTimestamp><maxRemLocalTimestamp>${new Date().getTime()}</maxRemLocalTimestamp></request>`,
            }
        }).then(res => {
            let jsonObj = parser.parse(res)
            // console.log(jsonObj)
            // 将单词分类到单词本
            jsonObj.response.actionlist.action.forEach(action => {
                let book = books[action.tags]
                if (book == null) {
                    book = new Book()
                    book.name = action.tags
                    books[action.tags] = book
                }
                book.addWord(action.word)
            })
            _.map(books, v => {
                logger.info(this.name, '单词本:', v.name, '单词量:', _.size(v.words))
            })
            // let myBook = books[Config.youdao.unchecktag]
            this.maxServerTimestamp = jsonObj.response.maxServerTimestamp
            this.maxRemServerTimestamp = jsonObj.response.maxRemServerTimestamp
            // buildMaimemo()
            return books
        })
    }

    /**
     * 查询有道单词
     * @param wordEn
     * @returns {*}
     */
    getYoudaoWord(wordEn) {
        return this.req.get(`http://dict.youdao.com/jsonapi?q=${encodeURIComponent(wordEn)}&doctype=json&keyfrom=mac.main&id=92EAC020C265501643DB359450E87E0E&vendor=cidian.youdao.com&appVer=2.3.3&client=macdict&jsonversion=2`, {
            json: true
        })
    }

    moveToTag(word, tag) {
        logger.info(this.name, '移动单词', word.name, '到', tag)
        let t = new Date().getTime()
        return this.req.post(`http://dict.youdao.com/wordbook/api?keyfrom=mac.main&id=80:E6:50:00:E4:EE&model=MacBookPro11,2&deviceid=C02N62Q0G3QC&mid=Mac%20OS%20X%2010.13.6&requestNum=2000`, {
            form: {
                data: `<?xml version="1.0" encoding="utf-8" ?><request><type>words</type><operation>commit</operation><maxLocalTimestamp>${this.maxServerTimestamp}</maxLocalTimestamp><maxRemLocalTimestamp>${youdaoBookInfo.maxRemServerTimestamp}</maxRemLocalTimestamp>
                <actionlist><action type="add"><word><![CDATA[${word.name}]]></word><wordInfo>
                <phonetic><![CDATA[]]></phonetic><trans><![CDATA[${word.getCn()}]]></trans>
                <tags><![CDATA[;${tag}]]></tags><addtime>${Math.round(t / 1000)}</addtime>
                <flag>1</flag></wordInfo></action></actionlist></request>`,
                version: 2,
            }
        }).then(res => {
            let jsonObj = parser.parse(res)
            this.maxServerTimestamp = jsonObj.response.maxServerTimestamp
            this.maxRemServerTimestamp = jsonObj.response.maxRemServerTimestamp
            // debugger
        })
    }


    async work() {
        this.books = await this.getWords()
        let res = await Maimemo.buildMaimemo(this.books[this.config.unchecktag], this.config.to_maimemo_bookid)
        for (let i = 0; i < res.newwords_notin_maimemo.length; i++) {
            // 先要获取释义，再移动
            let word = res.newwords_notin_maimemo[i]
            await this.getYoudaoWord(word.name).then(res => {
                word.youdaoData = res
                // console.log(word.toMaimemo())
            })
            // 移动单词
            if (this.config.noresulttag) {
                await this.moveToTag(word, this.config.noresulttag)
            }
        }
    }
}

module.exports = Youdao