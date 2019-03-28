const fetch = require('node-fetch')
const fs = require('fs');
const queryString = require('query-string');
const _ = require('lodash')
const parser = require('fast-xml-parser');
const { Book, Word } = require('./data')
const Config = require('./config')
const Youdao = require('./engine_youdao')
const Langeasy = require('./engine_langeasy')
const inquirer = require('inquirer')


// debug 添加环境变量 NODE_TLS_REJECT_UNAUTHORIZED=0
function doAnswers(answers) {
    switch (answers.type) {
        case 1:
            let youdaoEngine = new Youdao()
            youdaoEngine.start()
            break;
        case 2:
            let langeasyEngine = new Langeasy()
// langeasyEngine.debug = true
            langeasyEngine.start()
            break
    }
}

inquirer.prompt([
    {
        type: 'rawlist', name: 'type', message: '选择同步操作',
        choices: [
            { name: '有道单词本 => 墨墨', value: 1 },
            { name: '朗易思听 => 墨墨', value: 2 },
        ],
    },
]).then(doAnswers);