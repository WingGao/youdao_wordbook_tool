import express = require('express');
import serveIndex = require('serve-index');
import path = require('path');

let port;
export function localServer() {
  const app = express();
  app.use('/temp', express.static('temp'), serveIndex('temp'));
  return new Promise((resolve) => {
    let server = app.listen(0, () => {
      port = server.address().port;
      console.log(`localServer on http://localhost:${port}`);
      resolve();
    });
  });
}

export function getLocalUrl(tempFile: string) {
  let lp = path.relative(path.resolve(__dirname, 'temp'), tempFile);
  return `http://localhost:${port}/temp/${lp}`;
}
