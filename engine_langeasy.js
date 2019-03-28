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

class Langeasy extends Engine {
    constructor(props) {
        super('朗易思听');
        this.config = Config.langeasy
    }

    login() {
        if (_.size(this.config.username) > 0) {
            return this.req.get('https://langeasy.com.cn/denglu.action').then(res => {
                return this.req.post('https://langeasy.com.cn/login.action', {
                    form: {
                        name: this.config.username,
                        passwd: this.config.password,
                        redirectTo: 'https://langeasy.com.cn',
                    },
                    headers: {
                        'Upgrade-Insecure-Requests': 1,
                        'Referer': 'https://langeasy.com.cn/denglu.action',
                        'Origin': 'https://langeasy.com.cn',
                    }
                }).then(res2 => {
                    logger.error('朗易思听', '登录失败')
                }).catch(err => {
                    if (err.statusCode == 302) {
                        super.login()
                    } else {
                        logger.error('朗易思听', err)
                    }
                })
            })
            //     .then(res => {
            //     logger.info(res)
            // })
        }
    }

    getWords(page = 0, all = false) {
        return this.req.get(`https://langeasy.com.cn/getUserNewWord.action?page=${page}&time=${new Date().getTime()}`, { json: true })
            .then(res => {
                let plist = []
                if (page == 0) {
                    logger.info(this.name, '应获取单词数量', res.pageInfo.totalRecord)
                    if (all) {
                        // 自动获取所有单词
                        for (let i = 1; i < res.pageInfo.totalPage; i++) {
                            plist.push(this.getWords(i))
                        }
                    }
                }
                logger.info(this.name, `get words page=${page} len=${res.wordList.length}`)
                plist.push(Promise.resolve(res.wordList))
                return Promise.all(plist).then(presList => {
                    return [].concat.apply([], presList)
                })
            })
    }

    async work() {
        let words = await this.getWords(0, this.debug != true)
        logger.info(this.name, '总单词数量', words.length)
        let book = new Book()
        words.forEach(wd => {
            book.addWord(wd.word)
        })
        Maimemo.buildMaimemo(book, this.config.to_maimemo_bookid)
        // return book
    }
}

module.exports = Langeasy