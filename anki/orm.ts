import 'reflect-metadata';
import {
  createConnection,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Connection,
  PrimaryColumn,
} from 'typeorm';
import crypto = require('crypto');
import _ = require('lodash');

@Entity({ name: 'fields' })
export class AnkiField {
  @PrimaryColumn()
  ntid: number;
  @PrimaryColumn()
  name: string;
  @Column()
  ord: number;
  @Column({ type: 'blob' })
  config: any;
}
@Entity({ name: 'templates' })
export class AnkiTemplate {
  @PrimaryColumn()
  ntid: number;
  @PrimaryColumn()
  name: string;
  @Column()
  ord: number;
  @Column({ type: 'blob' })
  config: Buffer;
}
@Entity({ name: 'notetypes' })
export class AnkiNoteType {
  @PrimaryColumn()
  id: number;
  @Column()
  name: string;
}
@Entity({ name: 'notes' })
export class AnkiNote {
  @PrimaryColumn()
  id: number;
  @Column()
  mid: number;
  @Column()
  tags: string;
  @Column()
  flds: string;
  @Column()
  sfld: string;
  @Column()
  csum: number;

  private _fields;
  getFields(fieldTypes?: Array<AnkiField>): { [key: string]: AnkiFieldItem } {
    if (this._fields == null) {
      this._fields = {};
      this.flds.split('\x1f').map((f, i) => {
        let ft = fieldTypes[i];
        let ff = new AnkiFieldItem();
        ff.ord = ft.ord;
        ff.value = f;
        this._fields[ft.name] = ff;
      });
    }
    return this._fields;
  }

  static combineFields(
    fields: { [key: string]: AnkiFieldItem },
    fieldTypes: Array<AnkiField>,
  ): string {
    let res = [];
    for (let ft of fieldTypes) {
      res.push(_.get(fields, `${ft.name}.value`, ''));
    }
    return res.join('\x1f');
  }

  static checkSum(firstFieldVal: string) {
    const hash = crypto.createHash('SHA1');
    hash.update(firstFieldVal);
    let csum = parseInt(hash.digest().toString('hex').substr(0, 8), 16);
    return csum;
  }
}

class AnkiFieldItem {
  ord: number;
  value: string;
}

export async function initAnkiDB(dbpath) {
  let connection = createConnection({
    type: 'sqlite',
    database: dbpath,
    entities: [AnkiField, AnkiNote, AnkiTemplate, AnkiNoteType],
    synchronize: false,
    logging: true,
  });
  return connection;
}
class AnkiDB {
  c: Connection;
  db: string;
  constructor(dbpath: string) {
    this.db = dbpath;
  }

  async connect() {
    this.c = await initAnkiDB(this.db);
  }

  async getFields(noteTypeId: number) {
    let fields = await this.c
      .getRepository(AnkiField)
      .find({ where: { ntid: noteTypeId }, order: { ord: 'ASC' } });
    return fields;
  }

  async getNotes(where: { noteTypeId?: number }) {
    let toWhere = {};
    if (where.noteTypeId) toWhere['mid'] = where.noteTypeId;
    let notes = await this.c.getRepository(AnkiNote).find({
      where: toWhere,
    });
    return notes;
  }

  async getTemplates(noteTypeId: number) {
    let templates = await this.c.getRepository(AnkiTemplate).find({
      where: { ntid: noteTypeId },
    });
    return templates;
  }
}

export default AnkiDB;
if (require.main === module) {
  (async () => {
    let db = new AnkiDB('C:\\Users\\PX\\AppData\\Roaming\\Anki2\\temp\\collection.anki2');
    await db.connect();
    // let noteId = 1466847167726;
    // let fields = db.getFields(noteId);
    // let notes = db.getNotes({ noteTypeId: noteId });
  })();
}
