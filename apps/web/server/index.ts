import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Serves every artist's website from one process: the built theme bundle
 * for any host, and /api forwarded to the platform API with the visitor's
 * host attached so the API knows whose site it is.
 */
const port = Number(process.env.PORT ?? 3000);
const apiUrl = new URL(process.env.API_URL ?? 'http://localhost:4000');
const dist = fileURLToPath(new URL('../dist/', import.meta.url));

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

function proxy(req: IncomingMessage, res: ServerResponse) {
  const path = req.url!.replace(/^\/api/, '') || '/';
  const target = new URL(path, apiUrl);
  const headers = { ...req.headers, host: target.host, 'x-tenant-host': req.headers.host ?? '', 'x-forwarded-for': req.socket.remoteAddress ?? '' };
  const send = target.protocol === 'https:' ? httpsRequest : httpRequest;
  const upstream = send(target, { method: req.method, headers }, up => {
    res.writeHead(up.statusCode ?? 502, up.headers);
    up.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'upstream', message: 'The site is temporarily unavailable.' } }));
  });
  req.pipe(upstream);
}

async function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const urlPath = decodeURIComponent(new URL(req.url!, 'http://x').pathname);
  const file = normalize(join(dist, urlPath));
  const isAsset = file.startsWith(dist) && (await stat(file).then(s => s.isFile(), () => false));
  const path = isAsset ? file : join(dist, 'index.html');
  res.writeHead(200, {
    'content-type': types[extname(path)] ?? 'application/octet-stream',
    // Hashed bundle files never change; index.html must always be fresh.
    'cache-control': isAsset && urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(path).pipe(res);
}

createServer((req, res) => {
  if (req.url === '/healthz') return void res.end('ok');
  if (req.url?.startsWith('/api/')) return proxy(req, res);
  serveStatic(req, res).catch(() => {
    res.writeHead(500);
    res.end();
  });
}).listen(port, () => console.log(`Artist sites on :${port}, API at ${apiUrl.origin}`));
