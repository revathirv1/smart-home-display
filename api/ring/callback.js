module.exports = async function (req, res) {
  var query = req.query || {};
  var code = query.code || '';
  var error = query.error || '';

  if (error) {
    return res.status(400).json({
      ok: false,
      error: 'ring_oauth_error',
      message: error
    });
  }

  if (!code) {
    return res.status(400).json({
      ok: false,
      error: 'ring_auth_code_missing',
      message: 'The Ring OAuth flow did not return a code.'
    });
  }

  var clientId = process.env.RING_CLIENT_ID || '';
  var clientSecret = process.env.RING_CLIENT_SECRET || '';
  var redirectUri = process.env.RING_REDIRECT_URI || '';

  if (!clientId || !clientSecret) {
    return res.status(501).json({
      ok: false,
      error: 'ring_oauth_credentials_missing',
      message: 'Set RING_CLIENT_ID and RING_CLIENT_SECRET before exchanging the Ring auth code.',
      nextStep: 'Use the Ring auth endpoint to get the redirect URL and then configure the credentials in your deployment environment.'
    });
  }

  try {
    var tokenRes = await fetch('https://oauth.ring.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    var tokenBody = await tokenRes.text();
    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({
        ok: false,
        error: 'ring_oauth_exchange_failed',
        status: tokenRes.status,
        body: tokenBody || null
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Ring OAuth completed. Store the returned access and refresh tokens in your deployment environment to enable live feed access.',
      body: tokenBody || null
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'ring_oauth_exchange_failed',
      message: error.message
    });
  }
};
