const { logger } = require('./utils')
// const request = require('request')
const rp = require('request-promise-native')

class Engine {
    static get UA_BROWSER() {
        return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36'
    }

    constructor(name) {
        this.name = name
        this.isLogin = false
        this.req = null
        this.reqConfig = {
            jar: true,
            // proxy: 'http://localhost:8888',
            headers: {
                'User-Agent': Engine.UA_BROWSER,
            },
        }
        this.debug = false
    }

    buildReq() {
        if (this.req == null) {
            this.req = rp.defaults(this.reqConfig)
        }
        return this.req
    }

    login() {
        this.isLogin = true
    }

    work() {

    }

    async start() {
        this.buildReq()
        if (this.isLogin) {
        } else {
            await this.login()
            // logger.error(`${this.name} not login`)
        }
        await this.work()
    }
}

module.exports = {
    Engine,
}