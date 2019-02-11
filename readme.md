## 功能
将有道单词本同步到默默背单词

## 使用

* 复制`config.sample.js`为`config.js`
* 修改配置, 有道用的是客户端的cookie，墨墨用的是网页端的cookie
* 运行
* 将本地文件`m_<bookid>.txt`里的内容复制到墨墨的词库编辑器里

## 程序逻辑

* 获取有道单词本
* 将有道`<unchecktag>`里的单词去和墨墨里的比较
* 将墨墨官方存在的单词同步到墨墨的`<bookid>`词库
* 将墨墨官方不存在的单词移动到有道`<noresulttag>`单词本

## TODO

* [ ] 添加账户登录
* [ ] 自动同步到墨墨