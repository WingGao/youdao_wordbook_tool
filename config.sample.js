let Config = {
    maimemo: {
        bookid: 465109, // 要添加到墨墨的单词本
        cookie: `PHPSESSID=` // 要添加到墨墨的cookie
    },
    youdao: {
        unchecktag: 'cfa', // 需要同步的有道单词本
        noresulttag: 'cfa-mo', // 墨墨里没有的单词
        cookie: `OUTFOX_SEARCH_USER_ID=` // 有道客户端cookie
    }
}
module.exports = Config