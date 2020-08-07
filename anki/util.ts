import cheerio = require('cheerio');
import inquirer = require('inquirer');

export function parseTemplate(ankiHtml, cb) {
  let xid = `__wing_wrapper_${new Date().getTime()}`;
  let $ = cheerio.load(`<div id="${xid}">${ankiHtml}</div>`);
  cb($);
  return $(`#${xid}`).html();
}
