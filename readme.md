## 功能

* 将 有道单词本 同步到 墨墨背单词
* 将 朗易思听（不背单词/轻听英语）同步到 墨墨背单词
* 根据单词列表，查询本地牛津高阶9，添加到 Anki
* 将其他平台倒入`Anki`

## 使用

* 复制`config.sample.js`为`config.ts`
* 修改配置
* 安装依赖 `yarn install`
* 运行 `node --require ts-node/register index.ts`


## 默认单词本格式
```md
标题 = cfa
简介 = 暂无简介
标签 = 

//===wing word===

//===wing body===

```
## TODO

无


## 相关资料

* https://github.com/terasum/js-mdict 
* https://github.com/goldendict/goldendict
* https://www.pdawiki.com/forum/forum.php?mod=viewthread&tid=35754 牛津9
* https://www.pdawiki.com/forum/thread-35803-1-1.html 牛津9
* https://freemdict.com/2019/08/07/oalecd9
