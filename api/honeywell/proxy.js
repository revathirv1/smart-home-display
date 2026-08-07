module.exports = async function (req, res) {
  var token = process.env.HONEYWELL_API_TOKEN || process.env.HONEYWELL_ACCESS_TOKEN;
  var baseUrl = (process.env.HONEYWELL_API_BASE_URL || 'https://api.honeywell.com').replace(/\/+$/, '');

  if (!token) {
    return res.status(501).json({
      error: 'honeywell_api_token_missing',
      message: 'Honeywell API access is not configured. Set HONEYWELL_API_TOKEN in the environment.',
      helper: 'This endpoint proxies Honeywell API requests for server-side integrations.'
    });
  }

  var path = (req.query && req.query.path) || '';
  if (!path) {
    return res.status(400).json({
      error: 'missing_path',
      message: 'A relative Honeywell API path is required. Example: /api/honeywell/proxy?path=/v2/devices'
    });
  }

  if (typeof path !== 'string' || !path.startsWith('/')) {
    return res.status(400).json({
      error: 'invalid_path',
      message: 'The path parameter must be a string that begins with a slash. Example: /v2/devices'
    });
  }

  if (!path.startsWith('/v2/')) {
    return res.status(400).json({
      error: 'unsupported_path',
      message: 'Only Honeywell API v2 paths are supported by this proxy for now.',
      supportedPrefix: '/v2/'
    });
  }

  var method = (req.query && req.query.method) || req.method || 'GET';
  method = String(method).toUpperCase();
  var targetUrl = baseUrl + path;

  try {
    var options = {
      method: method,
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token
      },
      redirect: 'follow'
    };

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      if (req.body) {
        try {
          options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
          options.headers['Content-Type'] = 'application/json';
        } catch (error) {
          return res.status(400).json({ error: 'invalid_json_body', message: error.message });
        }
      }
    }

    var honeywellRes = await fetch(targetUrl, options);
    var responseBody = await honeywellRes.text();
    var contentType = honeywellRes.headers.get('content-type') || 'application/json';

    if (!honeywellRes.ok) {
      return res.status(honeywellRes.status).json({
        error: 'honeywell_api_error',
        status: honeywellRes.status,
        statusText: honeywellRes.statusText,
        body: responseBody || null
      });
    }

    res.setHeader('content-type', contentType);
    return res.status(honeywellRes.status).send(responseBody);
  } catch (err) {
    return res.status(502).json({ error: 'honeywell_proxy_failed', message: err.message });
  }
};
