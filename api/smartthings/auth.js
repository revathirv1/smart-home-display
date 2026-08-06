const querystring = require('querystring');

module.exports = function (req, res) {
  var clientId = process.env.SMARTTHINGS_CLIENT_ID || '';
  var redirectUri = process.env.SMARTTHINGS_REDIRECT_URI || '';
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'missing_smartthings_configuration' });
  }

  var params = querystring.stringify({
    response_type: 'code',
    client_id: clientId,
    scope: 'r:devices:* r:schedules:*',
    redirect_uri: redirectUri,
    state: 'smartthings-connect',
    client_secret: process.env.SMARTTHINGS_CLIENT_SECRET || ''
  });

  res.writeHead(302, {
    Location: 'https://auth-global.api.smartthings.com/oauth/authorize?' + params
  });
  res.end();
};
