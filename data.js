class Book {
    constructor() {
        this.name = null
        this.words = {}
    }

    addWord(en) {
        let word = new Word()
        word.name = en.trim()
        this.words[word.name] = word
    }
}

class Word {
    constructor() {
        this.name = null
        this.youdaoData = null
        this.maimemoExist = false //墨墨词库存在
        this.maimemoOld = false //墨墨当前单词表存在
    }

    getCn() {
        if (this.youdaoData == null) return ''
        let ec = this.youdaoData.ec
        if (ec != null) {
            if (ec.word.length > 1) {
                throw 'ec word length 1'
                debugger
            }
            return ec.word[0].trs.map(tr => {
                if (tr.tr.length > 1) {
                    throw `tr.tr.length > 1`
                    debugger
                }
                return tr.tr[0].l.i.join('、')
            }).join(';')
        } else {
            let wt = this.youdaoData.web_trans['web-translation'][0]
            return wt.trans.map(v => v.value).join(';')
        }
    }

    toMaimemo() {
        let cn = this.getCn()
        return `
${this.name} {
    解释 {
        ${cn}
    }
}
        `.trim()
        // 例句 {
        //     hello world
        //     你好世界
        // }
        // 助记 {
        //     [吐槽] Hi or Hello
        // }
    }
}

module.exports = {
    Book, Word,
}