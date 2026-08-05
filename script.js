// Smart Home Legacy Dashboard client logic
(function () {
  var statusPanel = document.getElementById('status-panel');
  var dashboardGrid = document.getElementById('dashboard-grid');
  var deviceCountEl = document.getElementById('device-count');
  var sceneCountEl = document.getElementById('scene-count');
  var sourceCountEl = document.getElementById('source-count');

  var mockData = {
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

  function updateStatus(message) {
    if (statusPanel) {
      statusPanel.textContent = message;
    }
  }

  function renderSummary() {
    if (deviceCountEl) {
      deviceCountEl.textContent = mockData.devices.length;
    }
    if (sceneCountEl) {
      sceneCountEl.textContent = mockData.scenes.length;
    }
    if (sourceCountEl) {
      sourceCountEl.textContent = mockData.sources.length;
    }
  }

  function createDeviceCard(device) {
    var card = document.createElement('article');
    card.className = 'device-card';

    var title = document.createElement('h2');
    title.textContent = device.name;
    card.appendChild(title);

    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = device.location || device.type || 'Unknown location';
    card.appendChild(meta);

    var stateRow = document.createElement('div');
    stateRow.className = 'property';
    stateRow.textContent = 'State: ' + (device.state || 'Unknown');
    card.appendChild(stateRow);

    if (device.type) {
      var typeRow = document.createElement('div');
      typeRow.className = 'property';
      typeRow.textContent = 'Type: ' + device.type;
      card.appendChild(typeRow);
    }

    if (device.status) {
      var statusRow = document.createElement('div');
      statusRow.className = 'property';
      statusRow.textContent = 'Status: ' + device.status;
      card.appendChild(statusRow);
    }

    card.addEventListener('click', function () {
      updateStatus('Showing details for ' + device.name + '.');
    });

    return card;
  }

  function renderDashboard() {
    if (!dashboardGrid) {
      return;
    }
    dashboardGrid.innerHTML = '';
    mockData.devices.forEach(function (device) {
      dashboardGrid.appendChild(createDeviceCard(device));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderSummary();
    renderDashboard();
    updateStatus('Dashboard loaded successfully.');
  });
})();
