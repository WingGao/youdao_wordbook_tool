export class Book {
  id: string;
  name: string;
  words: { [key: string]: Word } = {};

  addWord(en: string) {
    let word = new Word();
    word.name = en.trim();
    this.words[word.name] = word;
  }
}

export class Word {
  name: string;
  audioUS: { n: string; f: string };
  cn: string; //卡片内容-背面
  pharas: Array<Word> = []; //其他词组或习语
  tags: string[] = [];

  constructor() {
    // this.name = null;
    // this.audioUS = null; //美音 {n:'音标',f:'音频文件'}
    // this.youdaoData = null;
    // this.cn = null;
    // this.maimemoExist = false; //墨墨词库存在
    // this.maimemoOld = false; //墨墨当前单词表存在
    // this.pharas = [];
    // this.tags = [];
  }

  getCn() {
    if (this.cn != null) return this.cn;
    // if (this.youdaoData == null) return '';
    // let ec = this.youdaoData.ec;
    // if (ec != null) {
    //   if (ec.word.length > 1) {
    //     throw 'ec word length 1';
    //     debugger;
    //   }
    //   return ec.word[0].trs
    //     .map((tr) => {
    //       if (tr.tr.length > 1) {
    //         throw `tr.tr.length > 1`;
    //         debugger;
    //       }
    //       return tr.tr[0].l.i.join('、');
    //     })
    //     .join(';');
    // } else {
    //   let wt = this.youdaoData.web_trans['web-translation'][0];
    //   return wt.trans.map((v) => v.value).join(';');
    // }
  }

  toMaimemo() {
    let cn = this.getCn();
    return `
${this.name} {
    解释 {
        ${cn}
    }
}
        `.trim();
    // 例句 {
    //     hello world
    //     你好世界
    // }
    // 助记 {
    //     [吐槽] Hi or Hello
    // }
  }
}
