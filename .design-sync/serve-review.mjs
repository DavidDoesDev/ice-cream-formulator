// Local review server that binds on all interfaces (fixed port) so the
// .review.html page is reachable over Tailscale / SSH, not just localhost.
// The bundled http-serve.mjs binds 127.0.0.1:<random>; this mirrors its logic
// with a network-reachable host+port for remote review.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const ROOT = process.argv[2] ?? './ds-bundle';
const PORT = Number(process.argv[3] ?? 61838);
const HOST = '0.0.0.0';
const rootAbs = resolve(ROOT) + sep;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };

createServer((req, res) => {
  let pathname, p;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    p = resolve(ROOT, '.' + pathname);
  } catch { res.statusCode = 400; return res.end(); }
  if (pathname === '/') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html>'); }
  if (!p.startsWith(rootAbs) || !existsSync(p) || !statSync(p).isFile()) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
}).listen(PORT, HOST, () => {
  console.log(`serving ${resolve(ROOT)} on all interfaces at port ${PORT}`);
  console.log(`  local:     http://127.0.0.1:${PORT}/.review.html`);
  console.log(`  tailscale: http://das-mini.hamster-ghost.ts.net:${PORT}/.review.html`);
});
