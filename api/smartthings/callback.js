const querystring = require('querystring');

module.exports = async function (req, res) {
  var code = req.query && req.query.code;
  var redirectUri = process.env.SMARTTHINGS_REDIRECT_URI || '';
  var clientId = process.env.SMARTTHINGS_CLIENT_ID || '';
  var clientSecret = process.env.SMARTTHINGS_CLIENT_SECRET || '';

  if (!code || !redirectUri || !clientId || !clientSecret) {
    return res.status(400).json({ error: 'missing_smartthings_callback_parameters' });
  }

  try {
    var body = querystring.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri
    });

    var tokenRes = await fetch('https://auth-global.api.smartthings.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });

    if (!tokenRes.ok) {
      var errText = await tokenRes.text();
      return res.status(502).json({ error: 'token_exchange_failed', details: errText });
    }

    var tokenData = await tokenRes.json();

    return res.status(200).json({
      message: 'SmartThings connected',
      tokens: tokenData,
      note: 'Store refresh_token securely and use it for future calls. Do not commit tokens to source control.'
    });
  } catch (err) {
    return res.status(502).json({ error: 'smartthings_callback_error', message: err.message });
  }
};
