import Engine from './engine';
import { Book, Word } from './data';
import MdictClient from './engine_mdict';
import AnkiClient from './anki/client';
import { getLocalUrl } from './local';
import path = require('path');
import Config from './config';

const fetch = require('node-fetch');
const os = require('os');
const fs = require('fs');
const queryString = require('query-string');
const _ = require('lodash');
const parser = require('fast-xml-parser');
const moment = require('moment');
const utils = require('./utils');
const { logger } = utils;

const ANKI_HOST = 'http://localhost:18765';

const ANKI_NOTE_MODULES = {
  Basic: 'Basic',
  BasicSound: 'BasicSound',
  Ox9: 'Ox9',
};

// https://foosoft.net/projects/anki-connect/index.html#notes-for-mac-os-x-users
// 设置端口 18765
class AnkiNote {
  deckName: string;
  modelName: string = ANKI_NOTE_MODULES.Ox9;
  fields: {
    Front: string;
    Back: string;
    Sound: any;
  } = {} as any;
  options: {
    allowDuplicate: boolean;
  } = { allowDuplicate: false };
  tags: Array<string> = [];
  audio = null;

  static fromWord(w: Word) {
    let note = new AnkiNote();
    note.fields.Front = w.name;
    note.fields.Back = w.cn;
    note.tags = w.tags;
    return note;
  }

  // 需要开启http服务
  addAudio(url, filename) {
    // 检查媒体文件
    let isOk = fs.existsSync(path.join(Config.anki.mediaPath, filename));
    if (isOk) {
      this.fields.Sound += ` [sound:${filename}]`;
    } else {
      this.audio = {
        url: url,
        filename: filename,
        fields: ['Sound'],
      };
    }
  }
}

/*
audio = {
                "url": "https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=猫&kana=ねこ",
                "filename": "yomichan_ねこ_猫.mp3",
                "skipHash": "7e2c2f954ef6051373ba916f000168dc",
                "fields": [
                    "Front"
                ]
            }
 */

export default class EngineAnki extends Engine {
  mdict: MdictClient = new MdictClient();
  anki: AnkiClient = new AnkiClient();

  constructor() {
    super('Anki');
  }

  async fetchBookNames(): Promise<Array<Book>> {
    let decks = await this.anki.deckNamesAndIds();
    return _.map(decks.data.result, (v, k) => {
      let bk = new Book();
      bk.name = k;
      bk.id = v;
      return bk;
    });
  }

  fetchBookWords(book: Book): Promise<boolean> {
    throw new Error('not imp');
  }

  async lookup(word: string): Promise<Word> {
    //使用mdict的方法
    return this.mdict.lookup(word);
  }

  async canAdd(note: AnkiNote): Promise<boolean> {
    let res = await this.anki.canAddNotes([note]);
    return res.data.result[0];
  }

  async addWordToBook(book: Book, word: Word): Promise<boolean> {
    let wName = word.name;
    let aNote = AnkiNote.fromWord(word);
    aNote.deckName = book.name;
    if (!(await this.canAdd(aNote))) {
      this.logger.error('无法添加', wName);
      return false;
    }
    this.logger.info('查询', wName);
    word = await this.lookup(wName);
    if (word == null) {
      this.logger.error('无法查询', wName);
      return false;
    }
    let words = [word].concat(word.pharas);
    for (let w of words) {
      let note = AnkiNote.fromWord(w);
      note.deckName = book.name;
      // 判断在不在
      let ok = await this.canAdd(note);
      if (ok) {
        this.logger.info('添加', w.name);
        if (w.audioUS) {
          note.addAudio(getLocalUrl(w.audioUS.f), path.basename(w.audioUS.f));
        }
        let res = await this.anki.addNote(note);
        if (res.data.result > 0 && res.data.error == null) {
          //成功
          this.logger.info('添加成功', w.name, res.data.result);
        } else {
          throw new Error(res.data.error);
        }
      } else {
        this.logger.error('无法添加', w.name);
      }
    }
    return true;
  }
}
