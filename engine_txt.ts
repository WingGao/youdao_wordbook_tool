import Engine from './engine';
import { Book, Word } from './data';
import inquirer = require('inquirer');
import fs = require('fs');

export default class EngineTxt extends Engine {
  constructor() {
    super('TXT');
  }

  async fetchBookNames(): Promise<Array<Book>> {
    let { f } = await inquirer.prompt([
      {
        type: 'input',
        name: 'f',
        message: '单词本位置',
      },
    ]);
    if (!fs.existsSync(f)) {
      throw new Error('文件不存在');
    }
    let b = new Book();
    b.name = f;
    return [b];
  }

  async fetchBookWords(book: Book): Promise<boolean> {
    let lines = fs.readFileSync(book.name).toString().split('\n');
    for (let l of lines) {
      let ls = l.split(' ');
      if (ls.length > 0 && ls[0].length > 0) {
        book.addWord(ls[0]);
      }
    }
    return true;
  }

  async lookup(word): Promise<Word> {
    return Promise.resolve(undefined);
  }
}
