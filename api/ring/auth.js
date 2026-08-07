module.exports = async function (req, res) {
  var clientId = process.env.RING_CLIENT_ID || '';
  var clientSecret = process.env.RING_CLIENT_SECRET || '';
  var redirectUri = process.env.RING_REDIRECT_URI || '';
  var host = (req.headers && req.headers.host) || 'localhost';
  var protocol = req.headers && req.headers['x-forwarded-proto'] ? req.headers['x-forwarded-proto'] : 'https';
  var defaultRedirect = protocol + '://' + host + '/api/ring/callback';

  if (!clientId) {
    return res.status(501).json({
      error: 'ring_client_id_missing',
      message: 'Set RING_CLIENT_ID before starting Ring OAuth.',
      help: 'Create a Ring developer application and define RING_CLIENT_ID, RING_CLIENT_SECRET, and RING_REDIRECT_URI.'
    });
  }

  var resolvedRedirect = redirectUri || defaultRedirect;
  var authUrl = 'https://oauth.ring.com/oauth/authorize?client_id=' + encodeURIComponent(clientId) + '&response_type=code&redirect_uri=' + encodeURIComponent(resolvedRedirect);

  return res.status(200).json({
    ok: true,
    authUrl: authUrl,
    redirectUri: resolvedRedirect,
    message: 'Open this URL to authorize the Ring integration. The callback endpoint will receive the OAuth code.'
  });
};
