// Smart Home Legacy Dashboard client logic
(function () {
  var statusPanel = document.getElementById('status-panel');
  var dashboardGrid = document.getElementById('dashboard-grid');
  var deviceCountEl = document.getElementById('device-count');
  var sceneCountEl = document.getElementById('scene-count');
  var sourceCountEl = document.getElementById('source-count');

  var localFallbackData = {
    devices: [
      { name: 'Local Light', type: 'Light', state: 'On', location: 'Hallway' }
    ],
    scenes: [
      { name: 'Local Scene', description: 'Browser fallback only' }],
    sources: [
      { name: 'Local cache' }
    ]
  };

  function updateStatus(message) {
    if (statusPanel) {
      statusPanel.textContent = message;
    }
  }

  function renderSummary(data) {
    if (deviceCountEl) {
      deviceCountEl.textContent = data.devices.length;
    }
    if (sceneCountEl) {
      sceneCountEl.textContent = data.scenes.length;
    }
    if (sourceCountEl) {
      sourceCountEl.textContent = data.sources.length;
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

  function renderDashboard(data) {
    if (!dashboardGrid) {
      return;
    }
    dashboardGrid.innerHTML = '';
    for (var i = 0; i < data.devices.length; i += 1) {
      dashboardGrid.appendChild(createDeviceCard(data.devices[i]));
    }
  }

  function loadDashboard() {
    if (!window.fetch) {
      updateStatus('Old browser detected: using local fallback data.');
      renderSummary(localFallbackData);
      renderDashboard(localFallbackData);
      return;
    }

    fetch('/api/data')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Server returned ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        renderSummary(data);
        renderDashboard(data);
        updateStatus('Dashboard loaded from Vercel serverless API.');
      })
      .catch(function (error) {
        updateStatus('Failed to load backend data: ' + error.message);
        renderSummary(localFallbackData);
        renderDashboard(localFallbackData);
      });
  }

  document.addEventListener('DOMContentLoaded', loadDashboard);
})();
// Roku UI binding (local proxy)
(function () {
  function _byId(id) { return document.getElementById(id); }

  function showRokuResult(text) {
    var out = _byId('roku-result');
    if (out) out.textContent = text;
  }

  function fetchRokuInfo(ip, path, cb) {
    if (!ip) { cb('Missing IP'); return; }
    var url = '/api/roku?ip=' + encodeURIComponent(ip) + '&path=' + encodeURIComponent(path);
    fetch(url).then(function (resp) {
      if (!resp.ok) throw new Error('Status ' + resp.status);
      return resp.text();
    }).then(function (txt) {
      cb(null, txt);
    }).catch(function (err) {
      cb(err.message || String(err));
    });
  }

  function bindRokuUI() {
    var ipIn = _byId('roku-ip');
    var pathSel = _byId('roku-path');
    var btn = _byId('roku-query');
    if (!btn || !ipIn || !pathSel) return;
    btn.onclick = function () {
      var ip = ipIn.value.trim();
      var path = pathSel.value || '/query/device-info';
      showRokuResult('Loading...');
      fetchRokuInfo(ip, path, function (err, data) {
        if (err) {
          showRokuResult('Error: ' + err);
        } else {
          showRokuResult(data);
        }
      });
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    try { if (typeof loadDashboard === 'function') loadDashboard(); } catch (e) {}
    bindRokuUI();
  });
})();
