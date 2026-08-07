module.exports = async function (req, res) {
  var token = process.env.HONEYWELL_API_TOKEN || process.env.HONEYWELL_ACCESS_TOKEN;
  var baseUrl = (process.env.HONEYWELL_API_BASE_URL || 'https://api.honeywell.com').replace(/\/+$/, '');

  if (!token) {
    return res.status(501).json({
      error: 'honeywell_api_token_missing',
      message: 'Honeywell API access is not configured. Set HONEYWELL_API_TOKEN in the environment to fetch Honeywell devices.',
      recommended: 'Use /api/honeywell/proxy?path=/v2/devices once configured.'
    });
  }

  try {
    var targetUrl = baseUrl + '/v2/devices';
    var response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token
      },
      redirect: 'follow'
    });

    var body = await response.text();
    var contentType = response.headers.get('content-type') || 'application/json';

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'honeywell_api_error',
        status: response.status,
        statusText: response.statusText,
        body: body || null
      });
    }

    res.setHeader('content-type', contentType);
    return res.status(response.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'honeywell_proxy_failed', message: err.message });
  }
};
