module.exports = async function (req, res) {
  var refreshToken = process.env.SMARTTHINGS_REFRESH_TOKEN || '';
  var clientId = process.env.SMARTTHINGS_CLIENT_ID || '';
  var clientSecret = process.env.SMARTTHINGS_CLIENT_SECRET || '';

  if (!refreshToken || !clientId || !clientSecret) {
    return res.status(400).json({ error: 'missing_smartthings_tokens' });
  }

  try {
    var params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', refreshToken);

    var tokenRes = await fetch('https://auth-global.api.smartthings.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    if (!tokenRes.ok) {
      var errText = await tokenRes.text();
      return res.status(502).json({ error: 'refresh_failed', details: errText });
    }

    var tokenData = await tokenRes.json();
    var accessToken = tokenData.access_token;

    var devicesRes = await fetch('https://api.smartthings.com/v1/devices', {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        Accept: 'application/json'
      }
    });

    if (!devicesRes.ok) {
      var deviceErr = await devicesRes.text();
      return res.status(502).json({ error: 'device_query_failed', details: deviceErr });
    }

    var devices = await devicesRes.json();
    var normalized = [];

    if (devices.items && Array.isArray(devices.items)) {
      for (var i = 0; i < devices.items.length; i += 1) {
        var item = devices.items[i];
        var type = 'Unknown';
        var state = 'Unknown';

        if (item.type && item.type.toLowerCase().indexOf('lock') !== -1) {
          type = 'Lock';
        } else if (item.type && item.type.toLowerCase().indexOf('thermostat') !== -1) {
          type = 'Thermostat';
        } else if (item.type && item.type.toLowerCase().indexOf('light') !== -1) {
          type = 'Light';
        }

        if (item.status && item.status.components) {
          var comps = item.status.components;
          for (var compName in comps) {
            if (!Object.prototype.hasOwnProperty.call(comps, compName)) continue;
            var comp = comps[compName];
            if (comp.lock && comp.lock.lock != null) {
              state = comp.lock.lock; // locked/unlocked
            }
            if (comp.switch && comp.switch.switch != null) {
              state = comp.switch.switch;
            }
          }
        }

        normalized.push({
          name: item.label || item.name || 'SmartThings device',
          type: type,
          state: state,
          location: item.locationId || 'SmartThings',
          id: item.deviceId
        });
      }
    }

    res.status(200).json({ devices: normalized, source: 'SmartThings' });
  } catch (err) {
    res.status(502).json({ error: 'smartthings_error', message: err.message });
  }
};
