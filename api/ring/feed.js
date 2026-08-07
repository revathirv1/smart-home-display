module.exports = async function (req, res) {
  var accessToken = process.env.RING_ACCESS_TOKEN || '';
  var refreshToken = process.env.RING_REFRESH_TOKEN || '';
  var feedUrl = process.env.RING_FEED_URL || '';
  var deviceId = (req.query && req.query.deviceId) || '';

  if (feedUrl) {
    return res.status(200).json({
      ok: true,
      mode: 'configured',
      feedUrl: feedUrl,
      deviceId: deviceId || null,
      message: 'Use the configured Ring media URL for your live feed.'
    });
  }

  if (!accessToken && !refreshToken) {
    return res.status(501).json({
      error: 'ring_credentials_missing',
      message: 'Ring OAuth credentials are not configured yet. Complete the Ring auth flow first.',
      help: 'Set RING_ACCESS_TOKEN, RING_REFRESH_TOKEN, or RING_FEED_URL in the deployment environment.'
    });
  }

  return res.status(200).json({
    ok: true,
    mode: 'pending',
    deviceId: deviceId || null,
    message: 'Ring access is configured at the environment level. Add a Ring feed URL or a live media endpoint to expose the feed in this app.'
  });
};
