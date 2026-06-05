import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8788;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.bin': 'application/octet-stream',
};

function safeFile(urlPath) {
  const rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  if (!rel || rel.includes('..')) return null;
  return path.join(root, rel);
}

http
  .createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      const p = path.join(root, 'web', 'app.html');
      fs.readFile(p, (e, buf) => {
        if (e) {
          res.writeHead(500);
          res.end('missing web/app.html');
          return;
        }
        res.writeHead(200, { 'Content-Type': mime['.html'] });
        res.end(buf);
      });
      return;
    }

    const fp = safeFile(req.url);
    if (!fp) {
      res.writeHead(400);
      res.end('bad path');
      return;
    }
    fs.readFile(fp, (e, buf) => {
      if (e) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const ext = path.extname(fp).toLowerCase();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(buf);
    });
  })
  .listen(port, () => {
    console.log(`http://127.0.0.1:${port}/  (static root = project dir)`);
  });
