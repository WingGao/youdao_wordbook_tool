const fetch = require('node-fetch');
const os = require('os');
const fs = require('fs');
const path = require('path');
const queryString = require('query-string');
import _ = require('lodash');
const { Book, Word } = require('./data');
const Config = require('./config');
const moment = require('moment');
const sqlite3 = require('sqlite3').verbose();
const cheerio = require('cheerio');

class SqliteAsync {
  db: any;
  constructor(db_path, mode) {
    this.db = new sqlite3.Database(db_path, mode);
  }

  async get(sql, ...params): Promise<any> {
    return new Promise((resolve) => {
      this.db.get(sql, ...params, (err, row) => {
        resolve([err, row]);
      });
    });
  }
}

class MdictClient {
  db: SqliteAsync;
  path: string;
  constructor(dict_path?: string) {
    if (dict_path == null) dict_path = path.resolve(__dirname, 'mdict/oalecd9.db'); //默认使用牛津9
    this.path = dict_path;
    this.db = new SqliteAsync(dict_path, sqlite3.OPEN_READONLY);
  }

  async lookup(name) {
    let [err, row] = await this.db.get('SELECT * from mdx where entry = ?', name);
    if (err != null || row == null) return null;
    if (row.paraphrase.indexOf('@@@LINK') === 0) return null; //不关联
    const $ = cheerio.load(row.paraphrase);
    let top = $('top-g');
    let word = new Word();
    word.name = name;
    // 找美音
    let audious = top.find('audio-us');
    if (audious.length > 0) {
      audious = $(audious.get(0));
      word.audioUS = { n: audious.find('phon').text(), f: audious.parent().attr('href') };
      word.audioUS.f = await this.getRes(word.audioUS.f);
    }

    let hg = $('h-g');
    if (hg.length > 0) {
      word.cn = `<h-g>${$('h-g').html()}</h-g>`;
    } else {
      //多个词性
      let divs = $('subentry-g');
      word.cn = divs
        .map((i, v) => {
          return `<div><subentry-g>${$(v).html()}</subentry-g></div>`;
        })
        .get()
        .join('\n');
      // debugger
    }
    // idiom习语
    $('idm-g').each((i, v) => {
      v = $(v);
      let sw = new Word();
      sw.name = v.find('idm').text().replace(/[ˌˈ]/g, '');
      sw.cn = `<div>${v.html()}</div>`;
      sw.tags.push('idm');
      word.pharas.push(sw);
    });

    return word;
  }

  async getRes(res) {
    if (res.indexOf('://') > 0) {
      res = '\\' + res.split('://')[1];
    }
    let fname = path.resolve(__dirname, 'temp', res.substr(1));
    if (fs.existsSync(fname)) {
      return fname;
    }
    let [err, row] = await this.db.get('SELECT * from mdd where entry = ?', res);
    if (err == null && row != null) {
      // let buf = new Buffer.from(row)
      fs.writeFileSync(fname, row.file);
      return fname;
    }
    return null;
  }
}

async function test() {
  // let client =new MdictClient('/Volumes/D/DevEnvs/dicts/牛津高阶第九版 v3.1.2/牛津高阶双解(第9版)_V3.1.2版.mdx')
  let client = new MdictClient(path.resolve(__dirname, 'mdict/oalecd9.db'));
  let word = await client.lookup('due');
}

// test()

export default MdictClient;
