// Smart Home Legacy Dashboard client logic
(function () {
  var statusPanel = document.getElementById('status-panel');
  var dashboardGrid = document.getElementById('dashboard-grid');
  var deviceCountEl = document.getElementById('device-count');
  var sceneCountEl = document.getElementById('scene-count');
  var sourceCountEl = document.getElementById('source-count');
  function updateStatus(text) {
    if (statusPanel) {
      statusPanel.textContent = text;
    }
  }
  function createNode(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text) {
      node.textContent = text;
    }
    return node;
  }
  function getJson(url, success, failure) {
    if (window.fetch) {
      window.fetch(url).then(function (response) {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Network response was not OK');
      }).then(success).catch(failure);
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          success(JSON.parse(xhr.responseText));
        } catch (err) {
          failure(err);
        }
      } else {
        failure(new Error('XHR status ' + xhr.status));
      }
    };
    xhr.send(null);
  }
  function normalizeDevice(device) {
    var normalized = {
      id: device.id || device.deviceId || ('legacy-' + Math.random()),
      name: device.name || device.label || 'Unknown Device',
      type: device.type || device.device_type || 'sensor',
      brand: device.brand || device.sourceBrand || 'Generic',
      state: device.state || device.status || 'unknown',
      battery: device.battery || device.batteryLevel || null,
      lastSeen: device.lastSeen || device.updatedAt || null,
      raw: device
    };
    if (typeof normalized.state === 'boolean') {
      normalized.state = normalized.state ? 'on' : 'off';
    }
    if (normalized.type === 'switch' && typeof device.outputLevel === 'number') {
      normalized.level = device.outputLevel;
    }
    return normalized;
  }
  function renderSummary(devices, scenes, sources) {
    deviceCountEl.textContent = devices.length;
    sceneCountEl.textContent = scenes.length;
    sourceCountEl.textContent = sources.length;
  }
  function renderDeviceCard(device) {
    var card = createNode('article', 'device-card');
    var title = createNode('h2', null, device.name);
    var meta = createNode('div', 'meta', device.brand + ' · ' + device.type);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(createNode('span', 'property', 'State: ' + device.state));
    if (device.battery !== null) {
      card.appendChild(createNode('span', 'property', 'Battery: ' + device.battery + '%'));
    }
    if (device.lastSeen) {
      card.appendChild(createNode('span', 'property', 'Last seen: ' + device.lastSeen));
    }
    if (device.type === 'switch' || device.type === 'light') {
      var button = createNode('button', 'control-button', device.state === 'on' ? 'Turn off' : 'Turn on');
      button.onclick = function () {
        toggleDevice(device);
      };
      card.appendChild(button);
    }
    if (device.type === 'scene') {
      var sceneAction = createNode('button', 'control-button secondary', 'Activate scene');
      sceneAction.onclick = function () {
        updateStatus('Activating scene "' + device.name + '"...');
        window.setTimeout(function () {
          updateStatus('Scene "' + device.name + '" activated');
        }, 700);
      };
      card.appendChild(sceneAction);
    }
    return card;
  }
  function renderDashboard(devices, scenes, sources) {
    dashboardGrid.innerHTML = '';
    var allItems = devices.slice(0);
    for (var i = 0; i < scenes.length; i += 1) {
      allItems.push(scenes[i]);
    }
    if (!allItems.length) {
      var empty = createNode('div', 'device-card', 'No devices or scenes found.');
      dashboardGrid.appendChild(empty);
      return;
    }
    for (var j = 0; j < allItems.length; j += 1) {
      dashboardGrid.appendChild(renderDeviceCard(allItems[j]));
    }
  }
  function toggleDevice(device) {
    if (device.state === 'on') {
      device.state = 'off';
    } else {
      device.state = 'on';
    }
    updateStatus('Toggled "' + device.name + '" to ' + device.state + '.');
    renderDashboard(currentDevices, currentScenes, currentSources);
  }
  function onDataLoaded(data) {
    var devices = [];
    var scenes = [];
    var sources = data.sources || [];
    if (data.devices && data.devices.length) {
      for (var i = 0; i < data.devices.length; i += 1) {
        devices.push(normalizeDevice(data.devices[i]));
      }
    }
    if (data.scenes && data.scenes.length) {
      for (var j = 0; j < data.scenes.length; j += 1) {
        scenes.push(normalizeDevice(data.scenes[j]));
      }
    }
    currentDevices = devices;
    currentScenes = scenes;
    currentSources = sources;
    renderSummary(devices, scenes, sources);
    renderDashboard(devices, scenes, sources);
    updateStatus('Ready. Data aggregated from ' + sources.length + ' source(s).');
  }
  function onDataError() {
    updateStatus('Open API data unavailable. Rendering recycled device demo mode.');
    onDataLoaded(mockApiPayload);
  }
  var currentDevices = [];
  var currentScenes = [];
  var currentSources = [];
  var mockApiPayload = {
    sources: [
      { name: 'Open Developer API', type: 'direct' },
      { name: 'Recycled Local Hub', type: 'local' }
    ],
    devices: [
      { id: 'd1', name: 'Living Room Light', type: 'light', brand: 'OpenLight', state: 'off', lastSeen: '5 min ago' },
      { id: 'd2', name: 'Front Door Lock', type: 'switch', brand: 'SafeHome', state: 'on', battery: 84, lastSeen: '2 min ago' },
      { id: 'd3', name: 'Outdoor Temperature', type: 'sensor', brand: 'WeatherNet', state: '22°C', lastSeen: '1 min ago' }
    ],
    scenes: [
      { id: 's1', name: 'Evening Recycle Mode', type: 'scene', brand: 'LegacyBridge', state: 'ready' }
    ]
  };
  updateStatus('Connecting to open APIs...');
  getJson('/api/legacy/devices', onDataLoaded, onDataError);
}());