/**
 * 这个文件是专门处理anki的一些小工具
 * anki在管理媒体文件的时候，是不建议将媒体文件放在子文件夹中的
 * 因为同步和检查媒体都是与其相关，但是对个人用户而言是不合适的
 * 所以在导入anki其他资源的时候，需要将媒体文件移动，并且修改卡片
 */

import AnkiClient from './client';
const path = require('path');
const cheerio = require('cheerio');
const _ = require('lodash');
import AnkiDB, { AnkiNote, AnkiNoteType, AnkiTemplate } from './orm';
import inquirer = require('inquirer');

let client = new AnkiClient({
  mediaPath: path.resolve('C:\\Users\\PX\\AppData\\Roaming\\Anki2\\temp\\collection.media'),
});
let ankiDB = new AnkiDB('C:\\Users\\PX\\AppData\\Roaming\\Anki2\\temp\\collection.anki2');

function replaceImage(field, subDir) {
  let xid = `__wing_wrapper_${new Date().getTime()}`;
  let $ = cheerio.load(`<div id="${xid}">${field.value}</div>`);
  let imgs = $('img');
  let changed = false;
  imgs.each((i, img) => {
    let src = _.get(img.attribs, 'src', '').trim();
    if (_.size(src) > 0 && src.indexOf(subDir) < 0) {
      //替换一级目录为二级目录
      img.attribs.src = `${subDir}/${src}`;
      changed = true;
    }
  });
  field.value = $(`#${xid}`).html();
  return field;
}

function replaceSound(field, subDir) {
  let soundRe = /\[sound:([^\]]+)\]/gi;
  let res = field.value.replace(soundRe, (sd, p1) => {
    if (p1.indexOf(subDir) < 0) {
      return `[sound:${subDir}/${p1}]`;
    }
    return sd;
  });
  field.value = res;
  return field;
}

// 移动anki媒体文件
async function taskMoveAnkiMedia() {
  let deckName = '日语五十音';
  let sudDir = 'rywsy';
  let noteTypeName = 'text4';
  let noteTypeId;
  if (noteTypeId == null) {
    await inquirer.prompt([{ type: 'confirm', name: '1', message: '请打开Anki' }]);
    noteTypeId = await client.findModelId(noteTypeName); //1466847167726;
    console.log('获取NoteId', noteTypeName, noteTypeId);
  }

  let flagUpdateNotes = true;
  let flagUpdateTemplate = true;
  if (flagUpdateNotes) {
    await inquirer.prompt([{ type: 'confirm', name: '1', message: '请关闭Anki' }]);
    await ankiDB.connect();
    let fieldTypes = await ankiDB.getFields(noteTypeId);
    let notes = await ankiDB.getNotes({ noteTypeId });
    let noteRepo = await ankiDB.c.getRepository(AnkiNote);
    let toUpdates = [];
    for (let note of notes) {
      let fields = note.getFields(fieldTypes);
      // let sum1 = AnkiNote.checkSum(fields[fieldTypes[0].name].value);
      // if (sum1 != note.csum) {
      //   debugger;
      //   throw new Error(`校验错误 - ${note}`);
      // }
      replaceImage(fields.Image1, sudDir);
      replaceImage(fields.Image2, sudDir);
      replaceSound(fields.Pron1, sudDir);
      replaceSound(fields.Pron2, sudDir);
      let newFs = AnkiNote.combineFields(fields, fieldTypes);
      toUpdates.push({ id: note.id, u: { flds: newFs } });
    }
    console.log(notes.length);
    //开始更新
    for (let up of toUpdates) {
      let upRes = await noteRepo.update(up.id, up.u);
    }
    await ankiDB.c.close();
  }
  // 更新template
  if (flagUpdateTemplate) {
    await inquirer.prompt([{ type: 'confirm', name: '1', message: '请打开Anki' }]);
    let templatesRep = await client.modelTemplates(noteTypeName);
    let templates = templatesRep.data.result;
    for (let tp of _.toPairs(templates)) {
      _.forEach(tp[1], (tv, tn) => {
        let f = { value: tv };
        replaceImage(f, sudDir);
        templates[tp[0]][tn] = f.value;
      });
    }
    console.log('更新模板', noteTypeName);
    await client.updateModelTemplates(noteTypeName, templates);
  }
  console.log('更新完毕');
  return;
  // 更新note
  let notesRep = await client.findNotes(`deck:${deckName}`);
  let noteList = await client.notesInfo(notesRep.data.result);
  for (let note of noteList.data.result) {
    note.tags = []; //去除tag
    replaceImage(note.fields.Image1, sudDir);
    replaceImage(note.fields.Image2, sudDir);
    // replaceSound({ value: `[sound:01_あ1.mp3][sound:01_あ2.mp3][sound:01_あ3.mp3]` })
    replaceSound(note.fields.Pron1, sudDir);
    replaceSound(note.fields.Pron2, sudDir);
    let upNote = {
      id: note.noteId,
      fields: {},
    };
    _.forEach(note.fields, (v, k) => {
      upNote.fields[k] = v.value;
    });
    let upRes = await client.updateNoteFields(upNote);
    if (upRes.data.error != null) {
      console.error(upRes.data.error);
      debugger;
    }
  }
  for (let noteId of notesRep.data.result) {
  }
  let cardsRep = await client.findCards('deck:日语五十音');
  for (let cardId of cardsRep.data.result) {
    // 找到卡片
  }
  console.log(cardsRep);
}

taskMoveAnkiMedia();
