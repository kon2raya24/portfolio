// netlify/functions/messages-list.js
//
// Fetches contact-form submissions from the Netlify Forms API and returns
// them as JSON. Gated by HTTP Basic Auth against the ADMIN_PASSWORD env var.
//
// env vars required (set in Netlify dashboard → Site settings → Env vars):
//   - ADMIN_PASSWORD      single shared password (any user-id accepted)
//   - NETLIFY_API_TOKEN   Personal Access Token from app.netlify.com/user/applications
//                         (needs "forms:read" scope — default scope works)
//
// env vars auto-injected by Netlify at runtime:
//   - SITE_ID             the deployed site UUID

exports.handler = async (event) => {
  // 1. Basic Auth check — browser will prompt natively on 401 + WWW-Authenticate
  const authHeader = (event.headers.authorization || event.headers.Authorization || '').trim();
  if (!authHeader.toLowerCase().startsWith('basic ')) {
    return challenge('Authentication required');
  }

  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
  const colon = decoded.indexOf(':');
  const submittedPass = colon >= 0 ? decoded.slice(colon + 1) : decoded;

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return json(500, { error: 'ADMIN_PASSWORD env var is not set on Netlify' });
  }
  if (!constantTimeEqual(submittedPass, expected)) {
    return challenge('Invalid credentials');
  }

  // 2. Fetch submissions from Netlify Forms API
  const siteId = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const apiToken = process.env.NETLIFY_API_TOKEN;
  if (!siteId) {
    return json(500, { error: 'SITE_ID not available in function context' });
  }
  if (!apiToken) {
    return json(500, { error: 'NETLIFY_API_TOKEN env var is not set on Netlify' });
  }

  const url = `https://api.netlify.com/api/v1/sites/${siteId}/submissions?per_page=100`;

  let resp;
  try {
    resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
  } catch (e) {
    return json(502, { error: 'Network error calling Netlify API', detail: String(e) });
  }

  if (!resp.ok) {
    return json(502, { error: `Netlify API responded ${resp.status}`, detail: await resp.text() });
  }

  const submissions = await resp.json();

  // 3. Project to a stable, render-friendly shape (contact form only)
  const messages = submissions
    .filter((s) => s.form_name === 'contact')
    .map((s) => ({
      id: s.id,
      created_at: s.created_at,
      name: s.data?.name || s.name || '',
      email: s.data?.email || s.email || '',
      company: s.data?.company || s.company || '',
      opportunity_type: s.data?.opportunity_type || '',
      message: s.data?.message || '',
      is_spam: !!s.spam,
      site_url: s.site_url || '',
    }));

  return json(200, { count: messages.length, messages });
};

function challenge(msg) {
  return {
    statusCode: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Portfolio Admin", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: msg,
  };
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload),
  };
}

// Constant-time string compare so a timing attacker can't probe the password
// character-by-character. Both args coerced to string + same-length pad.
function constantTimeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) {
    // still walk a full compare to keep timing flat
    let diff = 1;
    const len = Math.max(aBuf.length, bBuf.length);
    for (let i = 0; i < len; i++) {
      diff |= (aBuf[i] || 0) ^ (bBuf[i] || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBuf.length; i++) {
    diff |= aBuf[i] ^ bBuf[i];
  }
  return diff === 0;
}
