const http = require('http');
const { URL } = require('url');

const PORT = process.env.PROXY_PORT || 3001;

function isPrivateIp(ip) {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function sendJson(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(payload);
}

const agent = new http.Agent({ keepAlive: true });

const server = http.createServer((req, res) => {
  // log incoming proxied requests (helpful for debugging spam)
  console.log('[proxy] %s %s', req.method, req.url);

  // (no server-side rate limiting) requests are proxied as received

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  let parsed;
  try {
    parsed = new URL(req.url, 'http://localhost');
  } catch (e) {
    return sendJson(res, 400, { error: 'invalid_url' });
  }

  const q = parsed.searchParams;
  const ip = (q.get('ip') || '').trim();
  let path = q.get('path') || '/';
  const method = (q.get('method') || (req.method || 'GET')).toUpperCase();

  if (!ip) return sendJson(res, 400, { error: 'missing ip' });
  if (!isPrivateIp(ip)) return sendJson(res, 400, { error: 'only private IPs allowed' });
  if (!path.startsWith('/')) path = '/' + path;

  const options = {
    host: ip,
    port: 8060,
    path: path,
    method: method,
    agent: agent,
    headers: {
      Accept: '*/*',
      // preserve a minimal UA to look like a Roku client if helpful
      'User-Agent': req.headers['user-agent'] || 'node-local-proxy'
    }
  };

  const rokReq = http.request(options, (rokRes) => {
    let body = '';
    rokRes.setEncoding('utf8');
    rokRes.on('data', (chunk) => { body += chunk; });
    rokRes.on('end', () => {
      // if Roku returned non-OK, forward structured error
      if (rokRes.statusCode >= 400) {
        return sendJson(res, rokRes.statusCode, {
          error: 'roku_remote_error',
          status: rokRes.statusCode,
          statusText: rokRes.statusMessage,
          body: body || null
        });
      }

      const headers = {
        'Content-Type': rokRes.headers['content-type'] || 'text/plain',
        'Access-Control-Allow-Origin': '*'
      };
      res.writeHead(rokRes.statusCode, headers);
      res.end(body);
    });
  });

  rokReq.on('error', (err) => {
    sendJson(res, 502, { error: 'proxy_failed', message: err.message });
  });

  // Roku expects empty POST bodies for keypresses; we don't forward request body
  rokReq.end();
});

server.listen(PORT, () => {
  console.log('Local Roku proxy listening on port', PORT);
  console.log('Example: curl -i "http://localhost:' + PORT + '/roku?ip=192.168.1.118&path=/query/device-info"');
});
