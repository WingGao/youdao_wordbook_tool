let Config = {
  maimemo: {
    bookid: 465109, // 要添加到墨墨的单词本
    username: '', // 墨墨的用户名 https://www.maimemo.com/home/login
    password: '', // 墨墨的密码
    cookie: ``, // 要添加到墨墨的cookie，填了密码可以不用填这个个
  },
  youdao: {
    cookie: `OUTFOX_SEARCH_USER_ID=`, // 有道网页端cookie http://dict.youdao.com/wordbook/wordlist?keyfrom=dict2.index#/
  },
  langeasy: {
    username: '', // 朗易思听的用户名 https://langeasy.com.cn/
    password: '', // 朗易思听的密码
    to_maimemo_bookid: undefined, // 需要同步到的墨墨单词本，如果不填，则使用默认的
  },
  xunfei: {
    apps: [
      {
        appid: '',
        appkey: '',
      },
    ],
  },
  anki: {
    mediaPath: path.resolve('C:\\Users\\PX\\AppData\\Roaming\\Anki2\\temp\\collection.media'),
  },
};
module.exports = Config;
