#!/usr/bin/env node
'use strict';

/* =============================================================================
 *  Portfolio backend — self-hosted replacement for Netlify Forms + the
 *  `messages-list` Netlify Function. Zero dependencies (Node 18+ built-ins).
 *
 *  Routes:
 *    POST / , /classic.html , /api/contact
 *                         Capture a contact-form submission -> data/messages.jsonl.
 *                         The site's forms stay Netlify-style (they post to their
 *                         own page); on Linode, nginx routes those POSTs here, so
 *                         the SAME HTML works on both Netlify and this server.
 *                         Native form posts get a 303 back to the form's ?sent=1
 *                         URL; fetch callers (night-shift console) get JSON.
 *    GET  /api/messages   HTTP Basic Auth (ADMIN_PASSWORD). Returns the exact JSON
 *                         shape admin/messages.html already renders.
 *    GET  /api/health     Liveness probe for nginx / uptime checks.
 *
 *  Env vars:
 *    PORT            listen port              (default 3000)
 *    HOST            bind address             (default 127.0.0.1 — nginx fronts it)
 *    DATA_DIR        where messages.jsonl lives (default ./data)
 *    ADMIN_PASSWORD  required to read /api/messages (endpoint 500s if unset)
 *    MAX_BODY_BYTES  request body cap         (default 65536)
 *
 *  Storage is append-only JSON Lines: one submission per line. No DB to install,
 *  trivial to back up (`cp messages.jsonl ...`), and a corrupt line never takes
 *  down the rest of the file.
 * ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MSG_FILE = path.join(DATA_DIR, 'messages.jsonl');
const MAX_BODY = parseInt(process.env.MAX_BODY_BYTES || String(64 * 1024), 10);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

fs.mkdirSync(DATA_DIR, { recursive: true });

// --- tiny per-IP sliding-window rate limiter (public POST endpoint) ----------
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX = 5; // 5 submissions / minute / IP
const rlHits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (rlHits.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  recent.push(now);
  rlHits.set(ip, recent);
  if (rlHits.size > 5000) {
    // opportunistic cleanup so the map can't grow unbounded
    for (const [k, v] of rlHits) {
      if (!v.some((t) => now - t < RL_WINDOW_MS)) rlHits.delete(k);
    }
  }
  return recent.length > RL_MAX;
}

function clientIp(req) {
  // nginx sets X-Forwarded-For; take the first hop. Fall back to the socket.
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.socket.remoteAddress || 'unknown';
}

function hostUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  return host ? `${proto}://${host}` : '';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let len = 0;
    const chunks = [];
    req.on('data', (c) => {
      len += c.length;
      if (len > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseForm(body) {
  // All three site forms post application/x-www-form-urlencoded.
  const out = {};
  for (const [k, v] of new URLSearchParams(body)) out[k] = v;
  return out;
}

// Only allow same-origin absolute paths as a post-submit redirect target so an
// attacker can't turn the form into an open redirect.
function safeRedirect(v) {
  if (!v || typeof v !== 'string') return null;
  if (!v.startsWith('/') || v.startsWith('//')) return null;
  if (/[\\\r\n]/.test(v)) return null;
  return v;
}

// ---------------------------------------------------------------------------
// POST /api/contact
// ---------------------------------------------------------------------------
async function handleContact(req, res) {
  const ip = clientIp(req);
  if (rateLimited(ip)) return sendText(res, 429, 'Too many submissions — please slow down.');

  let body;
  try {
    body = await readBody(req);
  } catch (_) {
    return sendText(res, 413, 'Message too large.');
  }
  const data = parseForm(body);

  // Honeypot: the bot-field input is hidden from humans. Anything in it = bot.
  const isSpam = String(data['bot-field'] || '').trim().length > 0;

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const message = String(data.message || '').trim();

  // Mirror the form's `required` attributes. Don't persist empty junk, but still
  // respond gracefully so the visitor sees the normal success path.
  if (!isSpam && (!name || !email || !message)) {
    return respondSubmit(req, res, 200, { ok: true, status: 'incomplete' });
  }

  const record = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    name: name.slice(0, 200),
    email: email.slice(0, 200),
    company: String(data.company || '').trim().slice(0, 200),
    opportunity_type: String(data.opportunity_type || '').trim().slice(0, 100),
    message: message.slice(0, 5000),
    is_spam: isSpam,
    site_url: hostUrl(req),
    ip,
  };

  try {
    fs.appendFileSync(MSG_FILE, JSON.stringify(record) + '\n');
  } catch (e) {
    console.error('[contact] write failed:', e.message);
    return sendText(res, 500, 'Could not save your message — please email directly.');
  }

  return respondSubmit(req, res, 200, { ok: true, status: 'received' });
}

// Native browser form submit -> 303 redirect back to the form's action URL,
// which already carries ?sent=1 (so the existing tech-fx.js / player-file.js
// success state fires). req.url is same-origin by construction. fetch() callers
// (the game console) send Accept: */* and just want a small JSON ack.
function respondSubmit(req, res, jsonStatus, jsonPayload) {
  const accept = String(req.headers.accept || '');
  if (accept.includes('text/html')) {
    const target = safeRedirect(req.url) || '/?sent=1';
    res.writeHead(303, { Location: target, 'Cache-Control': 'no-store' });
    res.end();
    return;
  }
  sendJson(res, jsonStatus, jsonPayload);
}

// ---------------------------------------------------------------------------
// GET /api/messages  (Basic Auth, same contract as the old Netlify function)
// ---------------------------------------------------------------------------
function handleMessages(req, res) {
  if (!ADMIN_PASSWORD) {
    return sendJson(res, 500, { error: 'ADMIN_PASSWORD env var is not set on the server' });
  }

  const auth = String(req.headers.authorization || '').trim();
  if (!auth.toLowerCase().startsWith('basic ')) return challenge(res, 'Authentication required');

  const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
  const colon = decoded.indexOf(':');
  const submittedPass = colon >= 0 ? decoded.slice(colon + 1) : decoded;
  if (!constantTimeEqual(submittedPass, ADMIN_PASSWORD)) return challenge(res, 'Invalid credentials');

  let messages = [];
  try {
    if (fs.existsSync(MSG_FILE)) {
      const lines = fs.readFileSync(MSG_FILE, 'utf8').split('\n');
      for (const line of lines) {
        const s = line.trim();
        if (!s) continue;
        try {
          const r = JSON.parse(s);
          messages.push({
            id: r.id,
            created_at: r.created_at,
            name: r.name || '',
            email: r.email || '',
            company: r.company || '',
            opportunity_type: r.opportunity_type || '',
            message: r.message || '',
            is_spam: !!r.is_spam,
            site_url: r.site_url || '',
          });
        } catch (_) {
          /* skip a single malformed line, keep the rest */
        }
      }
    }
  } catch (e) {
    return sendJson(res, 500, { error: 'Could not read messages', detail: e.message });
  }

  // Newest first — the admin table renders in the order it receives.
  messages.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  sendJson(res, 200, { count: messages.length, messages });
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function challenge(res, msg) {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="Portfolio Admin", charset="UTF-8"',
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(msg);
}

// Constant-time compare so a timing attacker can't probe the password
// character-by-character (ported from the original Netlify function).
function constantTimeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) {
    let diff = 1;
    const len = Math.max(aBuf.length, bBuf.length);
    for (let i = 0; i < len; i++) diff |= (aBuf[i] || 0) ^ (bBuf[i] || 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBuf.length; i++) diff |= aBuf[i] ^ bBuf[i];
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  let pathname = '/';
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch (_) {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  // The site's three forms post Netlify-style to the page they live on (so the
  // same HTML also works on Netlify). On Linode, nginx routes those POSTs here.
  const isContactPost =
    req.method === 'POST' &&
    (pathname === '/' || pathname === '/classic.html' || pathname === '/api/contact');

  try {
    if (isContactPost) return await handleContact(req, res);
    if (req.method === 'GET' && pathname === '/api/messages') return handleMessages(req, res);
    if (req.method === 'GET' && pathname === '/api/health') return sendJson(res, 200, { ok: true });
    return sendJson(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('[server] unhandled error:', e);
    if (!res.headersSent) sendJson(res, 500, { error: 'Internal error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`portfolio backend listening on http://${HOST}:${PORT}`);
  console.log(`  data file: ${MSG_FILE}`);
  if (!ADMIN_PASSWORD) console.warn('  WARNING: ADMIN_PASSWORD is unset — /api/messages will return 500');
});

// Graceful shutdown so systemd restarts are clean.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`\n${sig} received — shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}
