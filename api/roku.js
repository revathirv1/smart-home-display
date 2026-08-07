module.exports = async function (req, res) {
  var host = (req.headers && req.headers.host) || '';
  var isLocalHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  var isLocalDev = isLocalHost || process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV !== 'production';
  var allowProxy = process.env.ALLOW_ROKU_PROXY === '1' || isLocalDev;
  if (!allowProxy) {
    return res.status(403).json({
      error: 'Roku proxy disabled in production. Set ALLOW_ROKU_PROXY=1 for local testing or run outside production.',
      host: host,
      nodeEnv: process.env.NODE_ENV || 'undefined',
      vercelEnv: process.env.VERCEL_ENV || 'undefined'
    });
  }

  var ip = (req.query && req.query.ip) || '';
  var path = (req.query && req.query.path) || '/';
  var method = (req.query && req.query.method) || 'GET';

  if (!ip) return res.status(400).json({ error: 'missing required "ip" query parameter' });
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return res.status(400).json({ error: 'invalid IP format' });
  }

  var isPrivate =
    ip.indexOf('10.') === 0 ||
    ip.indexOf('127.') === 0 ||
    ip.indexOf('192.168.') === 0 ||
    (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip));

  if (!isPrivate) {
    return res.status(400).json({ error: 'only private/local IP ranges are allowed' });
  }

  if (!path.startsWith('/')) path = '/' + path;
  var target = 'http://' + ip + ':8060' + path;

  try {
    var options = {
      method: method.toUpperCase(),
      redirect: 'follow',
      headers: {
        Accept: '*/*'
      }
    };

    if (options.method === 'POST') {
      // Roku keypress endpoints typically expect an empty POST with no content-type header.
    }

    var fetchRes = await fetch(target, options);
    var body = await fetchRes.text();

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({
        error: 'roku_remote_error',
        status: fetchRes.status,
        statusText: fetchRes.statusText,
        body: body || null
      });
    }

    var ct = fetchRes.headers.get('content-type') || 'text/plain';
    res.setHeader('content-type', ct);
    return res.status(fetchRes.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'proxy_failed', message: err.message });
  }
};
