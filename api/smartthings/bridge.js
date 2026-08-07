module.exports = async function (req, res) {
  var payload = req.body || {};
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      payload = {};
    }
  }

  var query = req.query || {};
  var device = payload.device || query.device || '';
  var action = payload.action || query.action || 'toggle';
  var value = payload.value || query.value || '';
  var source = payload.source || query.source || 'unknown';

  var controllerUrl = process.env.SMARTTHINGS_BRIDGE_URL || process.env.DEVICE_CONTROL_URL || '';

  if (controllerUrl) {
    try {
      var forwarded = await fetch(controllerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ device: device, action: action, value: value, source: source })
      });

      var bodyText = await forwarded.text();
      if (!forwarded.ok) {
        return res.status(forwarded.status).json({
          ok: false,
          error: 'bridge_forward_failed',
          status: forwarded.status,
          body: bodyText || null
        });
      }

      return res.status(200).json({
        ok: true,
        mode: 'forwarded',
        forwardedTo: controllerUrl,
        device: device,
        action: action,
        value: value,
        source: source,
        responseBody: bodyText || null
      });
    } catch (error) {
      return res.status(502).json({
        ok: false,
        error: 'bridge_forward_failed',
        message: error.message
      });
    }
  }

  return res.status(200).json({
    ok: true,
    mode: 'mock',
    message: 'SmartThings bridge is not configured yet. Commands are accepted locally and can be forwarded to your own controller once SMARTTHINGS_BRIDGE_URL is set.',
    device: device || 'unspecified device',
    action: action,
    value: value,
    source: source
  });
};
