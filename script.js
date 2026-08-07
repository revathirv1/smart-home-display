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

  function bindToggleControls() {
    var localControls = [
      { id: 'toggle-living-room-light', name: 'Living Room Light' },
      { id: 'toggle-front-door-lock', name: 'Front Door Lock' }
    ];

    for (var i = 0; i < localControls.length; i += 1) {
      (function (control) {
        var checkbox = document.getElementById(control.id);
        if (!checkbox) return;
        checkbox.addEventListener('change', function () {
          updateStatus(control.name + ' is ' + (checkbox.checked ? 'On' : 'Off') + '.');
        });
      })(localControls[i]);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadDashboard();
    bindToggleControls();
  });
})();
// Roku UI binding (local proxy)
(function () {
  function _byId(id) { return document.getElementById(id); }

  function showRokuResult(text) {
    var out = _byId('roku-result');
    if (out) out.textContent = text;
  }

  function fetchRokuPath(ip, path, method, cb) {
    if (!ip) { cb('Missing IP'); return; }
    if (!path) { cb('Missing path'); return; }

    var url = '/api/roku?ip=' + encodeURIComponent(ip) + '&path=' + encodeURIComponent(path);
    if (method) {
      url += '&method=' + encodeURIComponent(method);
    }

    fetch(url).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (body) {
          try {
            var json = JSON.parse(body);
            if (json.error) {
              var detail = json.message ? ' - ' + json.message : '';
              if (json.status && json.statusText) {
                detail += ' (' + json.status + ' ' + json.statusText + ')';
              }
              throw new Error(json.error + detail + (json.body ? '\n' + json.body : ''));
            }
          } catch (e) {
            throw new Error('Status ' + resp.status + ': ' + body);
          }
        });
      }
      return resp.text();
    }).then(function (txt) {
      cb(null, txt);
    }).catch(function (err) {
      cb(err.message || String(err));
    });
  }

  function sendRokuKey(ip, key, cb) {
    if (!key) { cb('Missing Roku key'); return; }
    showRokuResult('Sending ' + key + '...');
    fetchRokuPath(ip, '/keypress/' + key, 'POST', function (err, data) {
      if (err) {
        cb(err);
      } else {
        cb(null, 'Sent ' + key + ' successfully.');
      }
    });
  }

  function bindRokuUI() {
    var ipIn = _byId('roku-ip');
    var pathSel = _byId('roku-path');
    var btn = _byId('roku-query');
    if (btn && ipIn && pathSel) {
      btn.onclick = function () {
        var ip = ipIn.value.trim();
        var path = pathSel.value || '/query/device-info';
        showRokuResult('Loading...');
        fetchRokuPath(ip, path, 'GET', function (err, data) {
          if (err) {
            showRokuResult('Error: ' + err);
          } else {
            showRokuResult(data);
          }
        });
      };
    }

    var buttons = document.querySelectorAll('[data-roku-key]');
    for (var i = 0; i < buttons.length; i += 1) {
      (function (button) {
        var key = button.getAttribute('data-roku-key');
        if (!key) return;
        button.onclick = function () {
          var ip = ipIn ? ipIn.value.trim() : '';
          if (!ip) {
            showRokuResult('Enter the Roku LAN IP first.');
            return;
          }
          sendRokuKey(ip, key, function (err, result) {
            if (err) {
              showRokuResult('Error: ' + err);
            } else {
              showRokuResult(result);
            }
          });
        };
      })(buttons[i]);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindRokuUI();
  });
})();
