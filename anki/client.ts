import axios, { AxiosInstance } from 'axios';
const _ = require('lodash');
const fs = require('fs');

class AnkiClient {
  client: AxiosInstance;
  version = 6;
  mediaPath: string;
  constructor(c?) {
    c = _.merge(
      {
        host: 'http://localhost:18765',
        mediaPath: null,
      },
      c,
    );
    this.client = axios.create({
      baseURL: c.host,
    });
    this.version = 6;
    this.mediaPath = c.mediaPath;
    if (this.mediaPath != null && !fs.existsSync(this.mediaPath)) {
      throw new Error(`anki媒体文件夹不存在 ${this.mediaPath}`);
    }
  }

  post(action, params?) {
    return this.client.post('/', {
      action,
      version: this.version,
      params,
    });
  }
  // deck
  deckNamesAndIds() {
    return this.post('deckNamesAndIds');
  }

  findCards(query) {
    return this.post('findCards', { query });
  }

  // notes https://github.com/FooSoft/anki-connect/blob/master/actions/notes.md
  addNote(note) {
    return this.post('addNote', { note });
  }
  canAddNotes(notes) {
    return this.post('canAddNotes', {
      notes,
    });
  }
  // front:due
  findNotes(query) {
    return this.post('findNotes', { query });
  }

  notesInfo(noteIds) {
    return this.post('notesInfo', {
      notes: noteIds,
    });
  }

  updateNoteFields(note) {
    return this.post('updateNoteFields', {
      note,
    });
  }
  //Model Actions
  modelNamesAndIds() {
    return this.post('modelNamesAndIds');
  }

  async findModelId(name) {
    let res = await this.modelNamesAndIds();
    return res.data.result[name];
  }
  modelTemplates(modelName) {
    return this.post('modelTemplates', { modelName });
  }
  updateModelTemplates(modelName, templates) {
    return this.post('updateModelTemplates', {
      model: {
        name: modelName,
        templates,
      },
    });
  }

  serveMedia() {}
}

export default AnkiClient;
