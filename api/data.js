module.exports = function (req, res) {
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
  res.status(200).json(data);
};
