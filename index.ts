import Youdao from './engine_youdao';
import _ = require('lodash');
const fetch = require('node-fetch');
const fs = require('fs');
const queryString = require('query-string');

import EngineAnki from './engine_anki';
import Engine from './engine';
import { Book } from './data';
import { localServer } from './local';
import EngineTxt from './engine_txt';
const parser = require('fast-xml-parser');
const Config = require('./config');
const inquirer = require('inquirer');

// debug 添加环境变量 NODE_TLS_REJECT_UNAUTHORIZED=0
function doAnswers(answers) {
  switch (answers.type) {
    case 1:
      let youdaoEngine = new Youdao();
      youdaoEngine.start();
      break;
    case 2:
      break;
    case 10: //单词表-牛津词典-anki
      break;
  }
}

async function chooseBook(books: Array<Book>): Promise<Book> {
  let fromBook = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'type',
      message: '选择单词本',
      choices: _.map(books, (v) => ({ name: `${v.name}[${v.id}]`, value: v })),
    },
  ]);
  return fromBook.type;
}

async function main() {
  await localServer();
  let fromType = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'type',
      message: '选择单词来源',
      choices: [
        { name: '有道单词本', value: new Youdao() },
        { name: 'TXT文件', value: new EngineTxt() },
      ],
    },
  ]);
  let from = fromType.type as Engine;
  let books = await from.fetchBookNames();
  let fromBook = await chooseBook(books);
  let toType = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'type',
      message: '选择单词去向',
      choices: [{ name: 'Anki', value: new EngineAnki() }],
    },
  ]);
  let to = toType.type as Engine;
  books = await to.fetchBookNames();
  let toBook = await chooseBook(books);
  //开始同步
  await from.fetchBookWords(fromBook);
  let wordNameList = _.keys(fromBook.words);
  for (let i in wordNameList) {
    console.log(`${parseInt(i) + 1}/${wordNameList.length}`);
    let w = fromBook.words[wordNameList[i]];
    await to.addWordToBook(toBook, w);
  }
}
main();
