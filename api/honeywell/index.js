module.exports = async function (req, res) {
  var token = process.env.HONEYWELL_API_TOKEN || process.env.HONEYWELL_ACCESS_TOKEN;
  var baseUrl = (process.env.HONEYWELL_API_BASE_URL || 'https://api.honeywell.com').replace(/\/+$/, '');

  if (!token) {
    return res.status(501).json({
      error: 'honeywell_api_token_missing',
      message: 'Honeywell API access is not configured. Set HONEYWELL_API_TOKEN before calling Honeywell endpoints.',
      docs: 'Use /api/honeywell/proxy?path=/v2/devices or /api/honeywell/devices once the token is configured.'
    });
  }

  res.status(200).json({
    message: 'Honeywell API proxy endpoint is available.',
    configuredBaseUrl: baseUrl,
    endpoints: [
      '/api/honeywell/proxy?path=/v2/devices',
      '/api/honeywell/devices'
    ]
  });
};
