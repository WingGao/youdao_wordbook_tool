import { Book, Word } from './data';

const { logger } = require('./utils');
import axios, { AxiosInstance } from 'axios';

abstract class Engine {
  name: string;
  isLogin: boolean = false;
  req: AxiosInstance = null;
  static get UA_BROWSER() {
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';
  }

  constructor(name, cookie?) {
    this.name = name;
    this.isLogin = false;
    this.req = axios.create({
      headers: { cookie, 'User-Agent': Engine.UA_BROWSER },
    });
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
  abstract async lookup(word): Promise<Word>;

  async addWordToBook(book: Book, word: Word): Promise<boolean> {
    return false;
  }

  async start() {
    if (this.isLogin) {
    } else {
      logger.info(this.name, '登录中');
      await this.login();
      // logger.error(`${this.name} not login`)
    }
    logger.info(this.name, '获取单词 开始');
    await this.work();
  }
}

export default Engine;
