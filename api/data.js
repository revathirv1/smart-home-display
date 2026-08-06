const { fetchSmartThingsDevices } = require('./smartthings/utils');

module.exports = async function (req, res) {
  try {
    var smartThingsResult = await fetchSmartThingsDevices();
    var data = {
      devices: [
        {
          name: 'Living Room Light',
          type: 'Light',
          state: 'On',
          location: 'Living room'
        },
        {
          name: 'Kitchen Thermostat',
          type: 'Thermostat',
          state: '72°F',
          location: 'Kitchen',
          status: 'Comfort mode'
        },
        {
          name: 'Front Door Lock',
          type: 'Lock',
          state: 'Locked',
          location: 'Entryway'
        },
        {
          name: 'Bedroom Speaker',
          type: 'Speaker',
          state: 'Paused',
          location: 'Bedroom'
        }
      ],
      scenes: [
        { name: 'Good Morning', description: 'Lights on, thermostat to 70°F' },
        { name: 'Away Mode', description: 'Locks engaged and lights off' }
      ],
      sources: [
        { name: 'Open Developer API' },
        { name: 'Local Hub' }
      ]
    };

    if (smartThingsResult && Array.isArray(smartThingsResult.devices)) {
      data.devices = data.devices.concat(smartThingsResult.devices);
      data.sources.push({ name: smartThingsResult.source || 'SmartThings' });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'data_aggregation_failed', message: err.message });
  }
};
