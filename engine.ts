import { Book, Word } from './data';
import axios, { AxiosInstance } from 'axios';
import { getLogger, Logger } from 'log4js';
abstract class Engine {
  name: string;
  isLogin: boolean = false;
  req: AxiosInstance = null;
  logger: Logger;
  // @ts-ignore
  static get UA_BROWSER() {
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';
  }

  constructor(name, cookie?) {
    this.name = name;
    this.isLogin = false;
    this.req = axios.create({
      headers: { cookie, 'User-Agent': Engine.UA_BROWSER },
    });
    this.logger = getLogger(name);
    // this.reqConfig = {
    //     jar: true,
    //     // proxy: 'http://localhost:8888',
    //     headers: {
    //         'User-Agent': Engine.UA_BROWSER,
    //     },
    // }
    // this.debug = false
  }

  login() {
    this.isLogin = true;
  }

  work() {}

  /**
   * 获取单词本
   */
  abstract fetchBookNames(): Promise<Array<Book>>;

  /**
   * 获取单词本的词汇
   */
  abstract fetchBookWords(book: Book): Promise<boolean>;

  /**
   * 查询单词
   * @param word {string}
   * @returns {Promise<any>}
   */
  abstract async lookup(word: string): Promise<Word>;

  /**
   * 添加单词，根据需求对单词进行细化
   * @param book
   * @param word
   */
  async addWordToBook(book: Book, word: Word): Promise<boolean> {
    return false;
  }

  async start() {}
}

export default Engine;
