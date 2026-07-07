// ─────────────────────────────────────────────────────────────
//  Icon map — Font Awesome 6 Free Solid unicode per type
// ─────────────────────────────────────────────────────────────
const TYPE_ICONS = {
  user:     '\uf007',  // fa-user
  machine:  '\uf108',  // fa-desktop
  ip:       '\uf0ac',  // fa-globe
  alert:    '\uf0e7',  // fa-bolt
  email:    '\uf0e0',  // fa-envelope
  file:     '\uf15b',  // fa-file
  process:  '\uf085',  // fa-gears
  group:    '\uf0c0',  // fa-users
  cloud:    '\uf0c2',  // fa-cloud
  server:   '\uf233',  // fa-server
  url:      '\uf0c1',  // fa-link
  hash:     '\uf292',  // fa-hashtag
  registry: '\uf1c0',  // fa-database
  domain:   '\uf0e8',  // fa-sitemap
  default:  '\uf013',  // fa-cog
};

const NODE_RADIUS = 26;

function iconCodeOf(type) {
  return TYPE_ICONS[(type || '').toLowerCase()] || TYPE_ICONS.default;
}

// Graph tile icons — ASCII code → emoji
// Used in the "icon" field of sentinel-graphs.json and the wizard.
// Storing codes (not emoji) in JSON keeps the file ASCII-safe across all
// PowerShell versions and encodings.
const GRAPH_ICONS = {
  folder:     '📁',
  key:        '🔑',
  web:        '🕸️',
  alert:      '🚨',
  email:      '📧',
  bug:        '🐛',
  desktop:    '🖥️',
  globe:      '🌐',
  search:     '🔍',
  shield:     '🛡️',
  warning:    '⚠️',
  lock:       '🔒',
  cloud:      '☁️',
  gear:       '⚙️',
  target:     '🎯',
  fire:       '🔥',
  skull:      '💀',
  chart:      '📊',
  wrench:     '🔧',
  files:      '🗂️',
  block:      '🚫',
  radar:      '📡',
  crown:      '👑',
  lockfile:   '🔏',
  person:     '👤',
  openfolder: '📂',
  blast:      '💥',
};

// Resolve a code (e.g. "key") to its emoji (e.g. "🔑").
// Falls back to the raw value so existing emoji strings still work.
function resolveGraphIcon(v) {
  if (!v) return GRAPH_ICONS.folder;
  return GRAPH_ICONS[v] ?? v;
}

// ─────────────────────────────────────────────────────────────
//  Built-in examples
// ─────────────────────────────────────────────────────────────
const EXAMPLES = {
  login: {
    config: {
      title: "Login Activity",
      query: `SigninLogs
| where TimeGenerated > ago(1d)
| extend result = iff(ResultType == "0", "Success", "Failure")
| project
    timestamp = TimeGenerated,
    user      = UserPrincipalName,
    machine   = tostring(DeviceDetail.displayName),
    result
| where isnotempty(machine)
| take 200`,
      nodes: [
        { id_column: "user",    type: "user"    },
        { id_column: "machine", type: "machine" }
      ],
      edges: [{
        from_column:  "user",
        to_column:    "machine",
        label_column: "result",
        color_map: { "Success": "#10b981", "Failure": "#ef4444" }
      }]
    },
    csv: `timestamp,user,machine,result
2025-07-01 08:10,alice,PC-ALICE-01,Success
2025-07-01 08:12,alice,SRV-FILE-01,Success
2025-07-01 09:03,bob,PC-BOB-01,Success
2025-07-01 09:45,bob,SRV-FILE-01,Success
2025-07-01 10:22,charlie,PC-CHARLIE-01,Success
2025-07-01 10:55,charlie,SRV-DC-01,Failure
2025-07-01 11:01,charlie,SRV-DC-01,Failure
2025-07-01 11:02,charlie,SRV-DC-01,Success`
  },

  lateral: {
    config: {
      title: "Lateral Movement",
      query: `DeviceNetworkEvents
| where TimeGenerated > ago(1d)
| where RemotePort in (445, 389, 3389, 1433, 443)
| project
    timestamp      = TimeGenerated,
    source_machine = DeviceName,
    dest_machine   = RemoteDeviceName,
    protocol       = case(
        RemotePort == 445,  "SMB",
        RemotePort == 389,  "LDAP",
        RemotePort == 3389, "RDP",
        RemotePort == 443,  "HTTPS",
        RemotePort == 1433, "TDS",
        "Other"),
    bytes = SentBytes
| where isnotempty(dest_machine)
| take 200`,
      nodes: [
        { id_column: "source_machine", type: "machine" },
        { id_column: "dest_machine",   type: "machine" }
      ],
      edges: [{
        from_column:  "source_machine",
        to_column:    "dest_machine",
        label_column: "protocol"
      }]
    },
    csv: `timestamp,source_machine,dest_machine,protocol,bytes
2025-07-01 14:01,PC-BOB-01,SRV-FILE-01,SMB,12400
2025-07-01 14:03,SRV-FILE-01,SRV-DC-01,LDAP,980
2025-07-01 14:04,SRV-DC-01,SRV-SQL-01,TDS,45000
2025-07-01 14:06,SRV-SQL-01,SRV-BACKUP-01,SMB,200000
2025-07-01 14:08,PC-BOB-01,SRV-DC-01,SMB,1100`
  },

  alert: {
    config: {
      title: "Alert Chain",
      query: `SecurityAlert
| mv-expand todynamic(Entities)
| project
    alert_id    = SystemAlertId,
    severity    = AlertSeverity,
    entity      = tostring(Entities.Name),
    entity_type = tolower(tostring(Entities.Type)),
    description = AlertName
| where isnotempty(entity)
| take 200`,
      nodes: [
        { id_column: "alert_id", type: "alert" },
        { id_column: "entity",   type_column: "entity_type" }
      ],
      edges: [{
        from_column:  "alert_id",
        to_column:    "entity",
        label_column: "severity",
        color_map: { "High": "#ef4444", "Medium": "#f59e0b", "Low": "#6b7280" }
      }]
    },
    csv: `alert_id,severity,entity,entity_type,description
ALT-001,High,charlie,user,Multiple failed logins
ALT-001,High,SRV-DC-01,machine,Multiple failed logins
ALT-002,Medium,SRV-DC-01,machine,Unusual outbound traffic
ALT-002,Medium,203.0.113.45,ip,Unusual outbound traffic
ALT-003,Low,SRV-FILE-01,machine,Sensitive file accessed
ALT-003,Low,charlie,user,Sensitive file accessed`
  }
};

// ─────────────────────────────────────────────────────────────
//  Core engine: config + CSV → graph data
// ─────────────────────────────────────────────────────────────
// GQL simulation state
let gqlCurrentData      = null;
let gqlOriginalEdgeData = [];
let gqlOriginalNodeData = [];

function buildGraph(config, csvText) {
  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row.");
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] !== undefined ? vals[i] : ''; });
    return obj;
  });

  if (!Array.isArray(config.nodes)) throw new Error('Config must have a "nodes" array.');
  if (!Array.isArray(config.edges)) throw new Error('Config must have an "edges" array.');

  config.nodes.forEach((nd, i) => {
    if (!nd.id_column) throw new Error(`nodes[${i}]: "id_column" is required.`);
    if (!headers.includes(nd.id_column.toLowerCase()))
      throw new Error(`nodes[${i}]: id_column "${nd.id_column}" not found in CSV.\nAvailable: ${headers.join(', ')}`);
  });

  config.edges.forEach((ed, i) => {
    if (!ed.from_column) throw new Error(`edges[${i}]: "from_column" is required.`);
    if (!ed.to_column)   throw new Error(`edges[${i}]: "to_column" is required.`);
    [ed.from_column, ed.to_column].forEach(c => {
      if (!headers.includes(c.toLowerCase()))
        throw new Error(`edges[${i}]: column "${c}" not found in CSV.\nAvailable: ${headers.join(', ')}`);
    });
  });

  const nodeMap = new Map();
  const edges   = [];

  rows.forEach(row => {
    // Build nodes
    config.nodes.forEach(nd => {
      const id = row[nd.id_column.toLowerCase()];
      if (!id || nodeMap.has(id)) return;
      const labelCol = nd.label_column ? nd.label_column.toLowerCase() : null;
      const label    = labelCol ? (row[labelCol] || id) : id;
      const type     = nd.type_column
        ? (row[nd.type_column.toLowerCase()] || 'default')
        : (nd.type || 'default');
      // Collect extra properties for tooltip
      const propCols = (nd.properties || []).map(p => p.toLowerCase());
      const properties = {};
      propCols.forEach(col => { if (row[col] !== undefined && row[col] !== '') properties[col] = row[col]; });
      nodeMap.set(id, { id, label, type, properties });
    });

    // Build edges
    config.edges.forEach(ed => {
      const from = row[ed.from_column.toLowerCase()];
      const to   = row[ed.to_column.toLowerCase()];
      if (!from || !to) return;
      const labelVal = ed.label_column ? row[ed.label_column.toLowerCase()] : (ed.label || '');
      let color = ed.color;
      if (ed.color_map && labelVal && ed.color_map[labelVal]) color = ed.color_map[labelVal];
      const edgePropCols = (ed.properties || []).map(p => p.toLowerCase());
      const edgeProperties = {};
      edgePropCols.forEach(col => { if (row[col] !== undefined && row[col] !== '') edgeProperties[col] = row[col]; });
      edges.push({ from, to, label: labelVal, color, properties: edgeProperties });
    });
  });

  return { nodes: [...nodeMap.values()], edges, rows, headers };
}

// ─────────────────────────────────────────────────────────────
//  Render vis-network
// ─────────────────────────────────────────────────────────────
let network = null;

function renderGraph(gd, title) {
  document.getElementById('graph-title').textContent = title || 'Custom Graph';

  const visNodes = new vis.DataSet(gd.nodes.map(n => {
    const iconCode = iconCodeOf(n.type);
    const r = NODE_RADIUS;
    return {
      id:    n.id,
      label: n.label,
      _type: n.type,
      shape: 'custom',
      ctxRenderer({ ctx, x, y, state: { selected, hover } }) {
        return {
          drawNode() {
            // Circle fill
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = '#161625';
            ctx.fill();
            // Circle border
            ctx.strokeStyle = selected ? '#fca5a5' : hover ? '#ef4444' : '#f87171';
            ctx.lineWidth = selected || hover ? 3 : 2;
            ctx.stroke();
            // Icon inside
            ctx.save();
            ctx.font = '900 16px "Font Awesome 6 Free"';
            ctx.fillStyle = '#f87171';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconCode, x, y);
            ctx.restore();
            // Label below circle
            ctx.save();
            ctx.font = '12px "Segoe UI", sans-serif';
            ctx.fillStyle = '#c8d0e0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(n.label, x, y + r + 5);
            ctx.restore();
          },
          nodeDimensions: { width: (r + 2) * 2, height: (r + 2) * 2 }
        };
      },
      title: (() => {
        const d = document.createElement('div');
        d.style.cssText = 'min-width:160px;max-width:280px;line-height:1.5';
        let html =
          `<div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:4px">${n.label}</div>` +
          `<span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;` +
          `color:#f87171;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.3);border-radius:3px;padding:1px 6px">${n.type}</span>`;
        if (n.properties && Object.keys(n.properties).length) {
          html += '<div style="margin-top:8px;display:flex;flex-direction:column;gap:3px">' +
            Object.entries(n.properties).map(([k, v]) =>
              `<div style="display:grid;grid-template-columns:90px 1fr;gap:6px;padding:3px 0;border-top:1px solid rgba(255,255,255,.05);">` +
              `<span style="color:#6b7280;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${k}</span>` +
              `<span style="color:#c8d0e0;font-size:10px;word-break:break-all">${v}</span></div>`
            ).join('') +
            '</div>';
        }
        d.innerHTML = html;
        return d;
      })()
    };
  }));

  // Detect parallel edges: count how many edges share the same (from,to) pair
  // then assign each a unique roundness so they fan out as curves
  const pairCount = new Map();   // key → total count
  const pairIndex = new Map();   // key → running index
  gd.edges.forEach(e => {
    const key = `${e.from}→${e.to}`;
    pairCount.set(key, (pairCount.get(key) || 0) + 1);
  });

  const visEdges = new vis.DataSet(gd.edges.map((e, i) => {
    let titleEl;
    if (e.properties && Object.keys(e.properties).length) {
      const d = document.createElement('div');
      d.style.cssText = 'min-width:140px;max-width:260px;line-height:1.5';
      let html = e.label ? `<div style="font-size:12px;font-weight:700;color:#e2e8f0;margin-bottom:6px">${e.label}</div>` : '';
      html += '<div style="display:flex;flex-direction:column;gap:3px">' +
        Object.entries(e.properties).map(([k, v]) =>
          `<div style="display:grid;grid-template-columns:90px 1fr;gap:6px;padding:3px 0;border-top:1px solid rgba(255,255,255,.05)">` +
          `<span style="color:#6b7280;font-size:10px">${k}</span>` +
          `<span style="color:#c8d0e0;font-size:10px;word-break:break-all">${v}</span></div>`
        ).join('') + '</div>';
      d.innerHTML = html;
      titleEl = d;
    }

    // Smooth curve assignment for parallel edges
    const key   = `${e.from}→${e.to}`;
    const total = pairCount.get(key) || 1;
    const idx   = pairIndex.get(key) ?? 0;
    pairIndex.set(key, idx + 1);
    let smooth;
    if (total === 1) {
      smooth = false;
    } else {
      // Fan edges: roundness values spread around 0 (-0.3, 0, +0.3 etc.)
      const step = 0.35;
      const offset = (idx - (total - 1) / 2) * step;
      smooth = offset === 0
        ? { type: 'curvedCW', roundness: 0.01 }   // nearly straight for the middle edge
        : { type: offset > 0 ? 'curvedCW' : 'curvedCCW', roundness: Math.abs(offset) };
    }

    return {
      id:         i,
      from:       e.from,
      to:         e.to,
      label:      e.label || '',
      arrows:     'to',
      color:      { color: e.color || '#6b7280', highlight: e.color || '#6b7280', hover: e.color || '#6b7280' },
      font:       { color: '#e2e8f0', size: 12, align: 'middle', background: '#1e1e35', strokeWidth: 2, strokeColor: '#0f0f1a' },
      hoverWidth: 0,
      selectionWidth: 0,
      smooth,
      ...(titleEl ? { title: titleEl } : {})
    };
  }));

  document.getElementById('stat-nodes').textContent = visNodes.length;
  document.getElementById('stat-edges').textContent = visEdges.length;

  document.getElementById('legend').innerHTML = '';

  if (network) network.destroy();
  network = new vis.Network(
    document.getElementById('network'),
    { nodes: visNodes, edges: visEdges },
    {
      layout:  { improvedLayout: true },
      physics: {
        solver: 'barnesHut',
        barnesHut: {
          gravitationalConstant: -14000,
          centralGravity: 0.3,
          springLength: 220,
          springConstant: 0.03,
          damping: 0.5,
          avoidOverlap: 1.0
        },
        stabilization: {
          enabled: true,
          iterations: 600,
          updateInterval: 10,
          fit: true
        }
      },
      interaction: { hover: true, tooltipDelay: 80, selectConnectedEdges: false },
      edges: { selectable: false }
    }
  );

  // Disable physics after stabilization so nodes stay put
  network.once('stabilizationIterationsDone', () => {
    network.setOptions({ physics: { enabled: false } });
  });

  // Double-click: collapse neighbours by type / expand cluster
  network.on('doubleClick', params => {
    if (params.nodes.length !== 1) return;
    const nodeId = params.nodes[0];
    if (network.isCluster(nodeId)) {
      network.openCluster(nodeId);
      spreadAfterOpen();
    } else {
      collapseNeighborsByType(nodeId);
    }
  });
  // Right-click on cluster: expand
  network.on('oncontext', params => {
    params.event.preventDefault();
    const nodeId = network.getNodeAt(params.pointer.DOM);
    if (nodeId !== undefined && network.isCluster(nodeId)) {
      network.openCluster(nodeId);
      spreadAfterOpen();
    }
  });

  document.getElementById('table-head').innerHTML =
    `<tr>${gd.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  document.getElementById('table-body').innerHTML =
    gd.rows.map(r =>
      `<tr>${gd.headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`
    ).join('');
}

// ─────────────────────────────────────────────────────────────
//  Collapse helpers
// ─────────────────────────────────────────────────────────────
function buildClusterRenderer(type, label, count) {
  const icon = iconCodeOf(type);
  const r    = NODE_RADIUS + 5;
  // How many shadow rings to draw (max 3)
  const rings = Math.min(count - 1, 3);
  return function({ ctx, x, y, state: { selected, hover } }) {
    return {
      drawNode() {
        // Shadow rings behind (offset right+down, decreasing opacity)
        for (let i = rings; i >= 1; i--) {
          const ox = i * 6;
          const oy = i * 6;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, r, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(15,15,26,${0.55 - i * 0.1})`;
          ctx.fill();
          ctx.save();
          ctx.setLineDash([5, 4]);
          ctx.strokeStyle = `rgba(248,113,113,${0.30 - i * 0.06})`;
          ctx.lineWidth   = 1.5;
          ctx.stroke();
          ctx.restore();
        }
        // Main circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = '#0f0f1a';
        ctx.fill();
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = selected ? '#fca5a5' : hover ? '#ef4444' : '#f87171';
        ctx.lineWidth   = selected || hover ? 3 : 2;
        ctx.stroke();
        ctx.restore();
        // Icon
        ctx.save();
        ctx.font         = '900 16px "Font Awesome 6 Free"';
        ctx.fillStyle    = '#f87171';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y);
        ctx.restore();
        // Label
        ctx.save();
        ctx.font         = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillStyle    = '#c8d0e0';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, y + r + 5);
        ctx.restore();
      },
      nodeDimensions: { width: (r + 2 + rings * 6) * 2, height: (r + 2 + rings * 6) * 2 }
    };
  };
}

function collapseNeighborsByType(nodeId) {
  const connected = network.getConnectedNodes(nodeId);
  if (!connected.length) return;

  // Group non-cluster neighbours by type
  const typeGroups = {};
  connected.forEach(nId => {
    if (network.isCluster(nId)) return;
    const n = network.body.data.nodes.get(nId);
    if (!n || n.id === nodeId) return;
    const t = n._type || 'default';
    if (!typeGroups[t]) typeGroups[t] = [];
    typeGroups[t].push(nId);
  });

  let clustered = false;
  Object.entries(typeGroups).forEach(([type, ids]) => {
    if (ids.length < 2) return;
    clustered = true;
    const idSet  = new Set(ids);
    const cap    = type.charAt(0).toUpperCase() + type.slice(1);
    const label  = `${cap} (${ids.length})`;
    network.cluster({
      joinCondition:  n => idSet.has(n.id),
      processProperties: (opts, childNodes) => {
        const names = childNodes.map(c => c.label || c.id).join('\n');
        const tip   = document.createElement('div');
        tip.style.cssText = 'background:#1e1e35;border:1px solid #2a2a40;border-radius:6px;padding:6px 10px;font-size:11px;color:#c8d0e0;white-space:pre;line-height:1.7';
        tip.textContent   = `${label}\n──────\n${names}`;
        opts.label  = label;
        opts._type  = type;
        opts.shape  = 'custom';
        opts.title  = tip;
        opts.ctxRenderer = buildClusterRenderer(type, label, ids.length);
        return opts;
      },
      clusterNodeProperties: { shape: 'custom', label, _type: type }
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  Spread nodes after cluster open to avoid overlap
// ─────────────────────────────────────────────────────────────
function spreadAfterOpen() {
  network.setOptions({
    physics: {
      enabled: true,
      solver: 'barnesHut',
      barnesHut: {
        gravitationalConstant: -14000,
        centralGravity: 0.3,
        springLength: 220,
        springConstant: 0.03,
        damping: 0.5,
        avoidOverlap: 1.0
      },
      stabilization: { enabled: false }
    }
  });
  // Let physics run for ~800ms then freeze again
  setTimeout(() => {
    network.setOptions({ physics: { enabled: false } });
  }, 800);
}

// ─────────────────────────────────────────────────────────────
//  Actions
// ─────────────────────────────────────────────────────────────
let _isBuiltIn = false;

function loadExample(key) {
  document.querySelectorAll('.example-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + key).classList.add('active');
  const data = EXAMPLES[key];
  document.getElementById('config-json').value = JSON.stringify(data.config, null, 2);
  document.getElementById('data-csv').value    = data.csv.trim();
  clearError();
  _isBuiltIn = true;
  visualize();
}

function visualize() {
  clearError();
  try {
    const configRaw = document.getElementById('config-json').value.trim();
    const csvRaw    = document.getElementById('data-csv').value.trim();
    if (!configRaw) throw new Error('Config JSON is empty. Use Build Scenario or the ✏ editor.');
    if (!csvRaw)    throw new Error('CSV data is empty. Use Build Scenario or the ✏ editor.');
    const config = JSON.parse(configRaw);
    const gd     = buildGraph(config, csvRaw);
    gqlCurrentData = gd;   // store for GQL queries
    clearGqlQuery(true);   // reset highlight on new graph
    renderGraph(gd, config.title);
    syncConfigDisplay();
    const qBtn = document.getElementById('btn-show-query');
    if (qBtn) qBtn.style.display = config.query ? '' : 'none';
    if (!_isBuiltIn) autoSave(configRaw, csvRaw);
    _isBuiltIn = false;
  } catch (err) {
    _isBuiltIn = false;
    showError(err.message);
  }
}

function onConfigFile(evt) {
  const f = evt.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    document.getElementById('config-json').value = e.target.result;
    document.querySelectorAll('.example-btn').forEach(b => b.classList.remove('active'));
  };
  r.readAsText(f);
  evt.target.value = '';
}

function onDataFile(evt) {
  const f = evt.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    document.getElementById('data-csv').value = e.target.result;
    document.querySelectorAll('.example-btn').forEach(b => b.classList.remove('active'));
  };
  r.readAsText(f);
  evt.target.value = '';
}

// ─────────────────────────────────────────────────────────────
//  Error helpers
// ─────────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('main-error');
  el.textContent = '⚠ ' + msg;
  el.style.display = 'block';
}

function clearError() {
  const el = document.getElementById('main-error');
  el.textContent = '';
  el.style.display = 'none';
}

// ─────────────────────────────────────────────────────────────
//  My Graphs — localStorage persistence
// ─────────────────────────────────────────────────────────────
const LS_KEY = 'sentinel-graph-examples';

function loadMyExamples() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function saveMyExamples(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function saveCustomExample() {
  const configRaw = document.getElementById('config-json').value.trim();
  const csvRaw    = document.getElementById('data-csv').value.trim();
  if (!configRaw || !csvRaw) { showError('Nothing to save.'); return; }
  let name, icon;
  try { const cfg = JSON.parse(configRaw); name = cfg.title; icon = resolveGraphIcon(cfg.icon); }
  catch { showError('Config JSON is invalid.'); return; }
  if (!name) { showError('Add a "title" field to Config JSON to name this graph.'); return; }
  clearError();
  const list = loadMyExamples();
  const idx  = list.findIndex(e => e.name === name);
  const entry = { name, config: configRaw, csv: csvRaw, icon };
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  saveMyExamples(list);
  renderMyExamplesList();
}

function deleteMyExample(name) {
  const list = loadMyExamples().filter(e => e.name !== name);
  saveMyExamples(list);
  renderMyExamplesList();
}

function loadMyExample(name) {
  const entry = loadMyExamples().find(e => e.name === name);
  if (!entry) return;
  document.querySelectorAll('.example-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('config-json').value = entry.config;
  document.getElementById('data-csv').value    = entry.csv;
  clearError();
  visualize();
}

function renderMyExamplesList() {
  const list = loadMyExamples();
  const container = document.getElementById('my-examples-list');
  if (!list.length) {
    container.innerHTML = '<span class="empty-hint">No saved examples yet.</span>';
    return;
  }
  container.innerHTML = list.map(e => `
    <div class="my-example-row">
      <button class="example-btn" onclick='loadMyExample(${JSON.stringify(e.name)})' style="margin:0;flex:1">
        <span class="label">${e.icon} ${e.name}</span>
      </button>
      <button class="btn-del" onclick='exportExample(${JSON.stringify(e.name)})' title="Export as JSON">⬇</button>
      <button class="btn-del" onclick='deleteMyExample(${JSON.stringify(e.name)})' title="Delete">✕</button>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────
//  Export / Import — single bundle JSON
//  Format: { version, name, config (object), csv (string) }
// ─────────────────────────────────────────────────────────────
function exportFiles() {
  const configRaw = document.getElementById('config-json').value.trim();
  const csvRaw    = document.getElementById('data-csv').value.trim();
  if (!configRaw && !csvRaw) { showError('Nothing to export.'); return; }
  clearError();
  let config;
  try { config = JSON.parse(configRaw); } catch { config = {}; }
  const name = config.title || 'graph';
  const safeName = name.replace(/[^a-z0-9_\-]/gi, '_');
  const bundle = { version: 1, name, config, csv: csvRaw };
  downloadText(JSON.stringify(bundle, null, 2), `${safeName}.graph.json`, 'application/json');
}

function exportExample(name) {
  const entry = loadMyExamples().find(e => e.name === name);
  if (!entry) return;
  let config;
  try { config = JSON.parse(entry.config); } catch { config = {}; }
  const bundle = { version: 1, name: entry.name, config, csv: entry.csv };
  const safeName = name.replace(/[^a-z0-9_\-]/gi, '_');
  downloadText(JSON.stringify(bundle, null, 2), `${safeName}.graph.json`, 'application/json');
}

function exportAllGraphs() {
  const list = loadMyExamples();
  if (!list.length) { showError('No saved graphs to export.'); return; }
  clearError();
  const all = list.map(e => {
    let config;
    try { config = JSON.parse(e.config); } catch { config = {}; }
    return { version: 1, name: e.name, config, csv: e.csv };
  });
  downloadText(JSON.stringify(all, null, 2), 'my-graphs.json', 'application/json');
}

function onBundleFile(evt) {
  const f = evt.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      // Support both single bundle (object) and multi-graph export (array)
      const bundles = Array.isArray(parsed) ? parsed : [parsed];
      const list = loadMyExamples();
      let imported = 0;
      for (const bundle of bundles) {
        if (!bundle.config || !bundle.csv) continue;
        const name = bundle.name || 'Imported';
        const icon = resolveGraphIcon(bundle.config.icon);
        const configRaw = JSON.stringify(bundle.config, null, 2);
        const idx = list.findIndex(e => e.name === name);
        const entry = { name, config: configRaw, csv: bundle.csv, icon };
        if (idx >= 0) list[idx] = entry; else list.push(entry);
        // Load last one into editors
        document.getElementById('config-json').value = configRaw;
        document.getElementById('data-csv').value    = bundle.csv;
        imported++;
      }
      saveMyExamples(list);
      renderMyExamplesList();
      syncConfigDisplay();
      document.querySelectorAll('.example-btn').forEach(b => b.classList.remove('active'));
      clearError();
      if (imported === 0) throw new Error('No valid bundles found in file.');
    } catch (err) {
      showError('Invalid file: ' + err.message);
    }
  };
  r.readAsText(f);
  evt.target.value = '';
}

function downloadText(content, filename, mime) {
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─────────────────────────────────────────────────────────────
//  Zoom controls
// ─────────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function autoSave(configRaw, csvRaw) {
  // Only UPDATE existing My Graphs entries — never auto-insert new ones
  let name, icon;
  try { const cfg = JSON.parse(configRaw); name = cfg.title; icon = resolveGraphIcon(cfg.icon); } catch { return; }
  if (!name) return;
  const list = loadMyExamples();
  const idx  = list.findIndex(e => e.name === name);
  if (idx < 0) return; // not in My Graphs — don't auto-create
  list[idx] = { ...list[idx], name, config: configRaw, csv: csvRaw, ...(icon ? { icon } : {}) };
  saveMyExamples(list);
  renderMyExamplesList();
}

function syncConfigDisplay() {
  // Sync into the editor modal (if open or when next opened)
  const cfg = document.getElementById('editor-config');
  if (cfg) cfg.value = document.getElementById('config-json').value;
  const dat = document.getElementById('editor-data');
  if (dat) dat.value = document.getElementById('data-csv').value;
}

function injectEditorQuery(configRaw) { return configRaw; }

// ─────────────────────────────────────────────────────────────
//  Editor modal
// ─────────────────────────────────────────────────────────────
function openEditor() {
  syncConfigDisplay();
  switchEditorTab('config');
  document.getElementById('editor-overlay').style.display = 'flex';
}

function closeEditor() {
  document.getElementById('editor-overlay').style.display = 'none';
}

function openEditorOnQueryTab() {
  openEditor();
  switchEditorTab('query');
}

function handleEditorOverlay(evt) {
  if (evt.target === document.getElementById('editor-overlay')) closeEditor();
}

function switchEditorTab(tab) {
  document.getElementById('editor-config').style.display = tab === 'config' ? 'block' : 'none';
  document.getElementById('editor-data').style.display   = tab === 'data'   ? 'block' : 'none';
  document.getElementById('editor-visual').style.display = tab === 'visual' ? 'flex'  : 'none';
  document.getElementById('etab-config').classList.toggle('active', tab === 'config');
  document.getElementById('etab-data').classList.toggle('active',   tab === 'data');
  document.getElementById('etab-visual').classList.toggle('active', tab === 'visual');
  if (tab === 'visual') evBuildUI();
}

// ─── Visual editor helpers ───────────────────────────────────

function evHeaders() {
  const csv = document.getElementById('editor-data').value.trim();
  if (!csv) return [];
  return csv.split('\n')[0].split(',').map(h => h.trim().toLowerCase());
}

function evColSelect(name, val, includeBlank = true) {
  const headers = evHeaders();
  const blank = includeBlank ? '<option value="">— none —</option>' : '';
  const opts = headers.map(h => `<option value="${h}"${h === val ? ' selected' : ''}>${h}</option>`).join('');
  return `<select class="wiz-select" name="${name}">${blank}${opts}</select>`;
}

function evPropTags(selectedCols) {
  const headers = evHeaders();
  return headers.map(h =>
    `<button type="button" class="wiz-prop-tag${selectedCols.includes(h) ? ' active' : ''}" data-col="${h}" onclick="this.classList.toggle('active')">${h}</button>`
  ).join('');
}

function evAddNode(nd) {
  nd = nd || {};
  const div = document.createElement('div');
  div.className = 'wiz-entity-row';
  const sel = (col, name, blank) => evColSelect(name, col || '', blank);
  const props = nd.properties || [];
  div.innerHTML = `
    <button class="wiz-row-del" onclick="this.parentElement.remove(); evFlushToJson()">✕</button>
    <div class="wiz-cols-row">
      <div class="wiz-field-row">
        <label class="wiz-label">ID column <span class="wiz-badge-required">required</span></label>
        ${sel(nd.id_column, 'id_column', false)}
        <span class="wiz-field-hint">Unique value that identifies each node</span>
      </div>
      <div class="wiz-field-row">
        <label class="wiz-label">Label column <span class="wiz-badge-optional">optional</span></label>
        ${sel(nd.label_column, 'label_column')}
        <span class="wiz-field-hint">Text shown under the node — defaults to ID</span>
      </div>
    </div>
    <div class="wiz-cols-row wiz-type-row">
      <div class="wiz-field-row">
        <label class="wiz-label">Type (fixed) <span class="wiz-badge-optional">optional</span></label>
        <select class="wiz-select" name="type">
          ${['user','machine','ip','alert','email','file','process','group','cloud','server','url','hash','registry','domain','default']
            .map(t => `<option value="${t}"${(nd.type||'default')===t?' selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="wiz-type-or">OR</div>
      <div class="wiz-field-row">
        <label class="wiz-label">Type column <span class="wiz-badge-optional">optional</span></label>
        ${sel(nd.type_column, 'type_column')}
        <span class="wiz-field-hint">Overrides fixed type</span>
      </div>
    </div>
    <div class="wiz-field-row">
      <label class="wiz-label">Tooltip properties <span class="wiz-badge-optional">optional</span></label>
      <div class="wiz-prop-tags">${evPropTags(props)}</div>
      <span class="wiz-field-hint">Click columns to show them in the hover tooltip</span>
    </div>`;
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', evFlushToJson));
  div.querySelectorAll('.wiz-prop-tag').forEach(t => t.addEventListener('click', () => setTimeout(evFlushToJson, 0)));
  document.getElementById('ev-nodes-list').appendChild(div);
}

function evAddEdge(ed) {
  ed = ed || {};
  const div = document.createElement('div');
  div.className = 'wiz-entity-row';
  const sel = (col, name, blank) => evColSelect(name, col || '', blank);
  const props = ed.properties || [];
  div.innerHTML = `
    <button class="wiz-row-del" onclick="this.parentElement.remove(); evFlushToJson()">✕</button>
    <div class="wiz-cols-row">
      <div class="wiz-field-row">
        <label class="wiz-label">From column <span class="wiz-badge-required">required</span></label>
        ${sel(ed.from_column, 'from_column', false)}
      </div>
      <div class="wiz-field-row">
        <label class="wiz-label">To column <span class="wiz-badge-required">required</span></label>
        ${sel(ed.to_column, 'to_column', false)}
      </div>
    </div>
    <div class="wiz-cols-row">
      <div class="wiz-field-row">
        <label class="wiz-label">Label column <span class="wiz-badge-optional">optional</span></label>
        ${sel(ed.label_column, 'label_column')}
      </div>
      <div class="wiz-field-row">
        <label class="wiz-label">Fixed label <span class="wiz-badge-optional">optional</span></label>
        <input type="text" class="wiz-input" name="label" value="${ed.label || ''}" placeholder="e.g. connects to" />
        <span class="wiz-field-hint">Used when no label column is set</span>
      </div>
    </div>
    <div class="wiz-field-row">
      <label class="wiz-label">Tooltip properties <span class="wiz-badge-optional">optional</span></label>
      <div class="wiz-prop-tags">${evPropTags(props)}</div>
      <span class="wiz-field-hint">Click columns to show them in the hover tooltip</span>
    </div>`;
  div.querySelectorAll('select, input').forEach(el => el.addEventListener('change', evFlushToJson));
  div.querySelectorAll('.wiz-prop-tag').forEach(t => t.addEventListener('click', () => setTimeout(evFlushToJson, 0)));
  document.getElementById('ev-edges-list').appendChild(div);
}

function evBuildUI() {
  document.getElementById('ev-nodes-list').innerHTML = '';
  document.getElementById('ev-edges-list').innerHTML = '';
  let cfg = {};
  try { cfg = JSON.parse(document.getElementById('editor-config').value); } catch {}
  (cfg.nodes || []).forEach(nd => evAddNode(nd));
  (cfg.edges || []).forEach(ed => evAddEdge(ed));
  if (!document.getElementById('ev-nodes-list').children.length) evAddNode();
  if (!document.getElementById('ev-edges-list').children.length) evAddEdge();
}

function evReadConfig() {
  let cfg = {};
  try { cfg = JSON.parse(document.getElementById('editor-config').value); } catch {}

  const f = (row, name) => row.querySelector(`[name="${name}"]`)?.value?.trim() || '';
  cfg.nodes = [...document.getElementById('ev-nodes-list').querySelectorAll('.wiz-entity-row')].map(row => {
    const nd = { id_column: f(row, 'id_column') };
    if (f(row, 'label_column')) nd.label_column = f(row, 'label_column');
    if (f(row, 'type_column'))  nd.type_column  = f(row, 'type_column');
    else                        nd.type         = f(row, 'type') || 'default';
    const props = [...row.querySelectorAll('.wiz-prop-tag.active')].map(t => t.dataset.col);
    if (props.length) nd.properties = props;
    return nd;
  });
  cfg.edges = [...document.getElementById('ev-edges-list').querySelectorAll('.wiz-entity-row')].map(row => {
    const ed = { from_column: f(row, 'from_column'), to_column: f(row, 'to_column') };
    if (f(row, 'label_column')) ed.label_column = f(row, 'label_column');
    else if (f(row, 'label'))   ed.label        = f(row, 'label');
    const props = [...row.querySelectorAll('.wiz-prop-tag.active')].map(t => t.dataset.col);
    if (props.length) ed.properties = props;
    return ed;
  });
  return cfg;
}

function evFlushToJson() {
  const cfg = evReadConfig();
  document.getElementById('editor-config').value = JSON.stringify(cfg, null, 2);
}


function saveFromEditor() {
  if (document.getElementById('etab-visual').classList.contains('active')) evFlushToJson();
  let configRaw = injectEditorQuery(document.getElementById('editor-config').value.trim());
  const csvRaw  = document.getElementById('editor-data').value.trim();
  if (!configRaw || !csvRaw) { alert('Config and data must not be empty.'); return; }
  let name, icon;
  try { const cfg = JSON.parse(configRaw); name = cfg.title; icon = resolveGraphIcon(cfg.icon); }
  catch { alert('Config JSON is invalid.'); return; }
  if (!name) { alert('Add a "title" field to the Config JSON.'); return; }
  const list = loadMyExamples();
  const idx  = list.findIndex(e => e.name === name);
  const entry = { name, config: configRaw, csv: csvRaw, icon };
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  saveMyExamples(list);
  renderMyExamplesList();
  // Sync hidden textareas and visualize
  document.getElementById('config-json').value = configRaw;
  document.getElementById('data-csv').value    = csvRaw;
  closeEditor();
  visualize();
}

function applyEditorAndVisualize() {
  if (document.getElementById('etab-visual').classList.contains('active')) evFlushToJson();
  const configRaw = injectEditorQuery(document.getElementById('editor-config').value.trim());
  const csvRaw    = document.getElementById('editor-data').value.trim();
  document.getElementById('config-json').value = configRaw;
  document.getElementById('data-csv').value    = csvRaw;
  closeEditor();
  visualize();
}

function toggleSection(id) {
  document.getElementById(id).classList.toggle('collapsed');
}

function zoomIn()  { if (!network) return; network.moveTo({ scale: network.getScale() * 1.3,  animation: { duration: 200, easingFunction: 'easeInOutQuad' } }); }
function zoomOut() { if (!network) return; network.moveTo({ scale: network.getScale() * 0.77, animation: { duration: 200, easingFunction: 'easeInOutQuad' } }); }
function zoomFit() { if (!network) return; network.fit({ animation: { duration: 300, easingFunction: 'easeInOutQuad' } }); }

// ─────────────────────────────────────────────────────────────
//  GQL Graph Query Simulation
// ─────────────────────────────────────────────────────────────
//
//  Supported syntax:
//    MATCH (n) RETURN n
//    MATCH (n:user) RETURN n
//    MATCH (n) WHERE n.id = 'Alice' RETURN n
//    MATCH (n) WHERE n.id CONTAINS 'alice' RETURN n
//    MATCH (n) WHERE n.type = 'machine' RETURN n
//    MATCH (a)-[r]->(b) RETURN a,r,b
//    MATCH (a:user)-[r]->(b:machine) RETURN a,r,b
//    MATCH (a)-[r]->(b) WHERE r.label = 'LogonSuccess' RETURN a,r,b
//    MATCH (a)-[r]->(b) WHERE a.id CONTAINS 'alice' AND r.label = 'LogonFailed' RETURN a,r,b

function parseGql(raw) {
  const q = raw.trim().replace(/\s+/g, ' ');

  const matchM  = q.match(/MATCH\s+(.+?)(?=\s+(?:WHERE|RETURN)\s|$)/i);
  const whereM  = q.match(/WHERE\s+(.+?)(?=\s+RETURN\s|$)/i);
  const returnM = q.match(/RETURN\s+(.+)$/i);

  if (!matchM) return { error: 'Missing MATCH clause' };
  if (!returnM) return { error: 'Missing RETURN clause' };

  const matchStr  = matchM[1].trim();
  const whereStr  = whereM  ? whereM[1].trim() : null;
  const returnStr = returnM[1].trim();

  // Validate RETURN: must be comma-separated identifiers, no trailing comma
  if (!/^[a-zA-Z_]\w*(\s*,\s*[a-zA-Z_]\w*)*$/.test(returnStr))
    return { error: `Invalid RETURN clause: "${returnStr}" — expected e.g. RETURN n  or  RETURN a,r,b` };

  // Edge pattern: (a[:type])-[r]->(b[:type])
  const edgeM = matchStr.match(/^\((\w+)(?::(\w+))?\)-\[(\w*)\]->\((\w+)(?::(\w+))?\)$/);
  // Node pattern: (n[:type])
  const nodeM = matchStr.match(/^\((\w+)(?::(\w+))?\)$/);

  let pattern;
  if (edgeM) {
    pattern = { kind:'edge', fromAlias:edgeM[1], fromType:edgeM[2]||null,
                relAlias:edgeM[3]||'r', toAlias:edgeM[4], toType:edgeM[5]||null };
  } else if (nodeM) {
    pattern = { kind:'node', alias:nodeM[1], nodeType:nodeM[2]||null };
  } else {
    return { error: `Cannot parse MATCH pattern: "${matchStr}"` };
  }

  // Parse WHERE conditions (supports AND)
  const conditions = [];
  if (whereStr) {
    for (const part of whereStr.split(/\s+AND\s+/i)) {
      const cM = part.match(/^(\w+)\.(\w+)\s+CONTAINS\s+'([^']*)'/i)
              || part.match(/^(\w+)\.(\w+)\s+STARTS WITH\s+'([^']*)'/i);
      const eqM = part.match(/^(\w+)\.(\w+)\s*=\s*'([^']*)'/i);
      if (cM) {
        const op = /CONTAINS/i.test(part) ? 'contains' : 'startsWith';
        conditions.push({ alias: cM[1], prop: cM[2].toLowerCase(), op, value: cM[3] });
      } else if (eqM) {
        conditions.push({ alias: eqM[1], prop: eqM[2].toLowerCase(), op:'eq', value: eqM[3] });
      } else {
        return { error: `Cannot parse WHERE condition: "${part}"` };
      }
    }
  }

  return { ok:true, pattern, conditions };
}

function _evalConditions(conditions, bindings) {
  return conditions.every(c => {
    const obj = bindings[c.alias];
    if (!obj) return true; // unknown alias → skip
    let val = '';
    if (c.prop === 'id')    val = String(obj.id    || '');
    if (c.prop === 'label') val = String(obj.label || '');
    if (c.prop === 'type')  val = String(obj._type || '');
    const vL = c.value.toLowerCase(), valL = val.toLowerCase();
    if (c.op === 'eq')         return valL === vL;
    if (c.op === 'contains')   return valL.includes(vL);
    if (c.op === 'startsWith') return valL.startsWith(vL);
    return false;
  });
}

function executeGql({ pattern, conditions }) {
  const nodeDs = network.body.data.nodes;
  const edgeDs = network.body.data.edges;
  const matchedNodeIds = new Set();
  const matchedEdgeIds = new Set();

  if (pattern.kind === 'node') {
    nodeDs.forEach(node => {
      if (pattern.nodeType && node._type !== pattern.nodeType) return;
      const b = { [pattern.alias]: { id: node.id, label: node.label, _type: node._type } };
      if (_evalConditions(conditions, b)) matchedNodeIds.add(node.id);
    });
  } else {
    edgeDs.forEach(edge => {
      const fn = nodeDs.get(edge.from);
      const tn = nodeDs.get(edge.to);
      if (!fn || !tn) return;
      if (pattern.fromType && fn._type !== pattern.fromType) return;
      if (pattern.toType   && tn._type !== pattern.toType)   return;
      const b = {
        [pattern.fromAlias]: { id: fn.id, label: fn.label, _type: fn._type },
        [pattern.toAlias]:   { id: tn.id, label: tn.label, _type: tn._type },
        [pattern.relAlias]:  { id: edge.id, label: edge.label || '', _type: 'edge' }
      };
      if (_evalConditions(conditions, b)) {
        matchedNodeIds.add(fn.id);
        matchedNodeIds.add(tn.id);
        matchedEdgeIds.add(edge.id);
      }
    });
  }
  return { matchedNodeIds, matchedEdgeIds };
}

function applyGqlHighlight(matchedNodeIds, matchedEdgeIds) {
  const nodeDs = network.body.data.nodes;
  const edgeDs = network.body.data.edges;

  // Store originals as arrays (preserves numeric IDs)
  gqlOriginalNodeData = nodeDs.get().map(n => ({ id: n.id, hidden: n.hidden || false }));
  gqlOriginalEdgeData = edgeDs.get().map(e => ({ id: e.id, hidden: e.hidden || false }));

  nodeDs.update(nodeDs.getIds().map(id => ({ id, hidden: !matchedNodeIds.has(id) })));
  edgeDs.update(edgeDs.getIds().map(id => ({ id, hidden: !matchedEdgeIds.has(id) })));
}

function restoreGqlHighlight() {
  if (!network) return;
  const nodeDs = network.body.data.nodes;
  const edgeDs = network.body.data.edges;
  if (gqlOriginalNodeData.length) nodeDs.update(gqlOriginalNodeData);
  if (gqlOriginalEdgeData.length) edgeDs.update(gqlOriginalEdgeData);
  gqlOriginalNodeData = [];
  gqlOriginalEdgeData = [];
}

function runGqlQuery() {
  const raw   = (document.getElementById('gql-input').value || '').trim();
  const hint  = document.getElementById('gql-result-hint');
  const input = document.getElementById('gql-input');
  if (!raw)    { hint.textContent = ''; input.classList.remove('gql-error'); input.removeAttribute('title'); return; }
  if (!network) { hint.textContent = 'No graph loaded.'; hint.className = 'gql-hint-warn'; return; }

  const parsed = parseGql(raw);
  if (!parsed.ok) {
    hint.textContent = '\u26a0 ' + parsed.error;
    hint.className = 'gql-hint-error';
    input.classList.add('gql-error');
    input.setAttribute('title', parsed.error);
    // shake animation
    input.classList.remove('gql-shake');
    void input.offsetWidth; // reflow to restart animation
    input.classList.add('gql-shake');
    return;
  }

  input.classList.remove('gql-error', 'gql-shake');
  input.removeAttribute('title');

  const { matchedNodeIds, matchedEdgeIds } = executeGql(parsed);
  applyGqlHighlight(matchedNodeIds, matchedEdgeIds);

  if (matchedNodeIds.size === 0 && matchedEdgeIds.size === 0) {
    hint.textContent = 'No results.';
    hint.className = 'gql-hint-warn';
  } else {
    hint.textContent = `\u2713 ${matchedNodeIds.size} node(s)` +
      (matchedEdgeIds.size ? `, ${matchedEdgeIds.size} edge(s)` : '') + ' matched';
    hint.className = 'gql-hint-ok';
  }
}

function clearGqlQuery(silent = false) {
  const input = document.getElementById('gql-input');
  if (!silent) input.value = '';
  input.classList.remove('gql-error', 'gql-shake');
  input.removeAttribute('title');
  const hint = document.getElementById('gql-result-hint');
  if (hint) { hint.textContent = ''; hint.className = ''; }
  restoreGqlHighlight();
}

function distributeGraph() {
  if (!network) return;
  const ids = network.body.nodeIndices;
  if (!ids || ids.length === 0) return;

  // Build undirected adjacency
  const adj = {};
  ids.forEach(id => { adj[id] = []; });
  (network.body.edgeIndices || []).forEach(eid => {
    const e = network.body.edges[eid];
    if (!e) return;
    if (adj[e.fromId]) adj[e.fromId].push(e.toId);
    if (adj[e.toId])   adj[e.toId].push(e.fromId);
  });

  // BFS from highest-degree node → assign layers
  const degree = id => adj[id]?.length || 0;
  const start  = ids.reduce((b, id) => degree(id) > degree(b) ? id : b, ids[0]);
  const layer  = new Map();
  const queue  = [start];
  layer.set(start, 0);
  while (queue.length) {
    const cur = queue.shift();
    adj[cur].forEach(nb => {
      if (!layer.has(nb)) { layer.set(nb, layer.get(cur) + 1); queue.push(nb); }
    });
  }
  // Disconnected nodes → extra layer at the end
  let maxLayer = 0;
  layer.forEach(l => { if (l > maxLayer) maxLayer = l; });
  ids.forEach(id => { if (!layer.has(id)) layer.set(id, maxLayer + 1); });

  // Group by layer
  const byLayer = new Map();
  layer.forEach((l, id) => {
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l).push(id);
  });
  const layers = [...byLayer.keys()].sort((a, b) => a - b);

  // Barycenter heuristic: sort nodes in each layer by avg X of their neighbors in the previous layer
  // This is the core of Sugiyama crossing-minimization
  const posX = new Map();
  ids.forEach(id => posX.set(id, 0));
  layers.forEach((l, li) => {
    const nodes = byLayer.get(l);
    if (li === 0) { nodes.forEach((id, i) => posX.set(id, i)); return; }
    nodes.forEach(id => {
      const prevNbs = adj[id].filter(nb => layer.get(nb) < l);
      const bary = prevNbs.length
        ? prevNbs.reduce((s, nb) => s + posX.get(nb), 0) / prevNbs.length
        : posX.get(id);
      posX.set(id, bary);
    });
    nodes.sort((a, b) => posX.get(a) - posX.get(b));
    nodes.forEach((id, i) => posX.set(id, i));
  });

  // Place nodes
  const LAYER_GAP = Math.max(200, NODE_RADIUS * 2 + 140);
  const NODE_GAP  = Math.max(170, NODE_RADIUS * 2 + 110);
  const totalH    = (layers.length - 1) * LAYER_GAP;

  network.setOptions({ physics: { enabled: false } });
  layers.forEach((l, li) => {
    const nodes = byLayer.get(l);
    const totalW = (nodes.length - 1) * NODE_GAP;
    nodes.forEach((id, ni) => {
      network.moveNode(id,
        -totalW / 2 + ni * NODE_GAP,
        -totalH / 2 + li * LAYER_GAP
      );
    });
  });

  // Light repulsion burst to fine-tune any remaining overlaps
  network.setOptions({
    physics: {
      enabled: true,
      solver: 'repulsion',
      repulsion: { nodeDistance: NODE_RADIUS * 2 + 60, springLength: 180, springConstant: 0.01, damping: 0.35 },
      stabilization: { enabled: false }
    }
  });
  setTimeout(() => {
    network.setOptions({ physics: { enabled: false } });
    network.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
  }, 1200);
}

// ─────────────────────────────────────────────────────────────
function showSchema() {
  document.getElementById('modal-overlay').classList.add('open');
}

function closeSchema() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) closeSchema();
}

// ─────────────────────────────────────────────────────────────
//  KQL Query modal
// ─────────────────────────────────────────────────────────────
function openQueryModal() {
  try {
    const query = JSON.parse(document.getElementById('config-json').value || '{}').query || '';
    document.getElementById('query-modal-text').value = query || '// No query saved for this graph.';
  } catch {
    document.getElementById('query-modal-text').value = '// Could not read query.';
  }
  document.getElementById('query-copy-btn').textContent = '\uf0c5  Copy';
  document.getElementById('query-modal-overlay').classList.add('open');
}

function closeQueryModal() {
  document.getElementById('query-modal-overlay').classList.remove('open');
}

function handleQueryModalOverlay(e) {
  if (e.target === e.currentTarget) closeQueryModal();
}

async function copyQuery() {
  const text = document.getElementById('query-modal-text').value;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById('query-copy-btn');
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy'; }, 1800);
  } catch { /* clipboard not available */ }
}

// ─────────────────────────────────────────────────────────────
//  Intro overlay
// ─────────────────────────────────────────────────────────────
function closeIntro() {
  const overlay = document.getElementById('intro-overlay');
  if (document.getElementById('intro-skip-cb').checked) {
    localStorage.setItem('sentinel-graph-skip-intro', '1');
  }
  overlay.classList.add('hidden');
  setTimeout(() => { overlay.style.display = 'none'; }, 420);
}

// ─────────────────────────────────────────────────────────────
//  Build Scenario Wizard
// ─────────────────────────────────────────────────────────────
let wizCurrentStep = 1;
let wizHeaders     = [];   // CSV column names parsed in step 1

function wizSetIcon(btn) {
  document.querySelectorAll('#wiz-icon-picker .icon-opt').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function wizGetIcon() {
  const sel = document.querySelector('#wiz-icon-picker .icon-opt.selected');
  return sel ? sel.dataset.icon : '\ud83d\udcc1';
}

function openWizard() {
  wizCurrentStep = 1;
  wizHeaders     = [];
  document.getElementById('wiz-csv').value = '';
  document.getElementById('wiz-preview').style.display = 'none';
  document.getElementById('wiz-nodes-list').innerHTML  = '';
  document.getElementById('wiz-edges-list').innerHTML  = '';
  document.getElementById('wiz-title').value           = '';
  document.getElementById('wiz-query').value           = '';
  document.getElementById('wiz-config-preview').value  = '';
  // Reset icon picker to first option
  document.querySelectorAll('#wiz-icon-picker .icon-opt').forEach((b, i) => b.classList.toggle('selected', i === 0));
  wizClearError();
  wizGoTo(1);
  document.getElementById('wizard-overlay').classList.add('open');
}

function closeWizard() {
  document.getElementById('wizard-overlay').classList.remove('open');
}

function handleWizardOverlay(e) {
  if (e.target === e.currentTarget) closeWizard();
}

function wizGoTo(step) {
  wizCurrentStep = step;
  document.querySelectorAll('.wpage').forEach(p => p.classList.remove('active'));
  document.getElementById('wpage-' + step).classList.add('active');
  // Step indicator
  document.querySelectorAll('.wstep').forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.toggle('active', n === step);
    s.classList.toggle('done',   n < step);
  });
  // Nav buttons
  const prev = document.getElementById('wiz-prev');
  const next = document.getElementById('wiz-next');
  prev.style.visibility = step === 1 ? 'hidden' : 'visible';
  next.innerHTML = step === 5
    ? '<i class="fa-solid fa-check"></i> Visualize'
    : 'Next <i class="fa-solid fa-arrow-right"></i>';
  wizClearError();
}

function wizNext() {
  wizClearError();
  if (wizCurrentStep === 1) {
    // Parse CSV
    const csv = document.getElementById('wiz-csv').value.trim();
    if (!csv) { wizShowError('Paste or load a CSV first.'); return; }
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { wizShowError('CSV needs at least a header row and one data row.'); return; }
    wizHeaders = lines[0].split(',').map(h => h.trim().toLowerCase());
    wizShowPreview(lines);
    // Pre-populate node/edge rows if empty
    if (!document.getElementById('wiz-nodes-list').children.length) wizAddNode();
    if (!document.getElementById('wiz-edges-list').children.length) wizAddEdge();
    wizGoTo(2);

  } else if (wizCurrentStep === 2) {
    if (!document.getElementById('wiz-nodes-list').children.length) {
      wizShowError('Add at least one node type.'); return;
    }
    const idCols = [...document.getElementById('wiz-nodes-list').querySelectorAll('[name="id_column"]')].map(s => s.value);
    const dupes = idCols.filter((v, i) => idCols.indexOf(v) !== i);
    if (dupes.length) { wizShowError(`Duplicate ID column: "${dupes[0]}" — each node type must use a different column.`); return; }
    wizGoTo(3);

  } else if (wizCurrentStep === 3) {
    if (!document.getElementById('wiz-edges-list').children.length) {
      wizShowError('Add at least one edge type.'); return;
    }
    wizGoTo(4);

  } else if (wizCurrentStep === 4) {
    // Build config preview for review step
    const config = wizBuildConfig();
    const title  = document.getElementById('wiz-title').value.trim() || 'My Scenario';
    const icon   = wizGetIcon();
    const query  = document.getElementById('wiz-query').value.trim();
    config.title = title;
    config.icon  = icon;
    if (query) config.query = query;
    document.getElementById('wiz-config-preview').value = JSON.stringify(config, null, 2);
    wizGoTo(5);

  } else if (wizCurrentStep === 5) {
    // Apply to main editors and visualize
    const csv    = document.getElementById('wiz-csv').value.trim();
    const configRaw = document.getElementById('wiz-config-preview').value;
    let config;
    try { config = JSON.parse(configRaw); } catch { wizShowError('Config JSON is invalid.'); return; }
    const icon = wizGetIcon();
    // Explicitly insert into My Graphs (wizard always creates a new entry)
    const list = loadMyExamples();
    const idx  = list.findIndex(e => e.name === config.title);
    const entry = { name: config.title, config: configRaw, csv: csv, icon };
    if (idx >= 0) list[idx] = entry; else list.push(entry);
    saveMyExamples(list);
    renderMyExamplesList();
    document.getElementById('config-json').value = configRaw;
    document.getElementById('data-csv').value    = csv;
    document.querySelectorAll('.example-btn').forEach(b => b.classList.remove('active'));
    clearError();
    closeWizard();
    visualize();
  }
}

function wizPrev() {
  if (wizCurrentStep > 1) wizGoTo(wizCurrentStep - 1);
}

// ── Preview table ──
function wizShowPreview(lines) {
  const headers = lines[0].split(',').map(h => h.trim());
  const rows    = lines.slice(1, 6); // show max 5 rows
  const box = document.getElementById('wiz-preview');
  box.style.display = 'block';
  box.innerHTML = `<table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.split(',').map(v => `<td>${v.trim()}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

// ── Column select helper ──
function wizColSelect(name, includeBlank = true) {
  const blank = includeBlank ? '<option value="">— none —</option>' : '';
  return `<select class="wiz-select" name="${name}">
    ${blank}${wizHeaders.map(h => `<option value="${h}">${h}</option>`).join('')}
  </select>`;
}

// ── Add node row ──
let wizNodeIdx = 0;
function wizAddNode() {
  const idx = wizNodeIdx++;
  const div = document.createElement('div');
  div.className = 'wiz-entity-row';
  div.id = `wnode-${idx}`;
  div.innerHTML = `
    <button class="wiz-row-del" onclick="this.parentElement.remove()">✕</button>
    <div class="wiz-cols-row">
      <div class="wiz-field-row">
        <label class="wiz-label">ID column <span class="wiz-badge-required">required</span></label>
        ${wizColSelect('id_column', false)}
        <span class="wiz-field-hint">Unique value that identifies each node</span>
      </div>
      <div class="wiz-field-row">
        <label class="wiz-label">Label column <span class="wiz-badge-optional">optional</span></label>
        ${wizColSelect('label_column')}
        <span class="wiz-field-hint">Text shown under the node — defaults to ID</span>
      </div>
    </div>
    <div class="wiz-cols-row wiz-type-row">
      <div class="wiz-field-row">
        <label class="wiz-label">Type (fixed) <span class="wiz-badge-optional">optional</span></label>
        <select class="wiz-select" name="type">
          <option value="user">user</option>
          <option value="machine">machine</option>
          <option value="ip">ip</option>
          <option value="alert">alert</option>
          <option value="email">email</option>
          <option value="file">file</option>
          <option value="process">process</option>
          <option value="group">group</option>
          <option value="cloud">cloud</option>
          <option value="server">server</option>
          <option value="url">url</option>
          <option value="hash">hash</option>
          <option value="registry">registry</option>
          <option value="domain">domain</option>
          <option value="default">default</option>
        </select>
        <span class="wiz-field-hint">Same icon for every node in this column</span>
      </div>
      <div class="wiz-type-or">OR</div>
      <div class="wiz-field-row">
        <label class="wiz-label">Type column <span class="wiz-badge-optional">optional</span></label>
        ${wizColSelect('type_column')}
        <span class="wiz-field-hint">Reads type per-row from this column — overrides fixed type</span>
      </div>
    </div>
    <div class="wiz-field-row">
      <label class="wiz-label">Tooltip properties <span class="wiz-badge-optional">optional</span></label>
      <div class="wiz-prop-tags">
        ${wizHeaders.map(h => `<button type="button" class="wiz-prop-tag" data-col="${h}" onclick="this.classList.toggle('active')">${h}</button>`).join('')}
      </div>
      <span class="wiz-field-hint">Click columns to show them in the hover tooltip</span>
    </div>`;
  document.getElementById('wiz-nodes-list').appendChild(div);
}

// ── Add edge row ──
let wizEdgeIdx = 0;
function wizAddEdge() {
  const idx = wizEdgeIdx++;
  const div = document.createElement('div');
  div.className = 'wiz-entity-row';
  div.id = `wedge-${idx}`;
  div.innerHTML = `
    <button class="wiz-row-del" onclick="this.parentElement.remove()">✕</button>
    <div class="wiz-cols-row">
      <div class="wiz-field-row">
        <label class="wiz-label">From column <span class="wiz-badge-required">required</span></label>
        ${wizColSelect('from_column', false)}
      </div>
      <div class="wiz-field-row">
        <label class="wiz-label">To column <span class="wiz-badge-required">required</span></label>
        ${wizColSelect('to_column', false)}
      </div>
    </div>
    <div class="wiz-cols-row">
      <div class="wiz-field-row">
        <label class="wiz-label">Label column <span class="wiz-badge-optional">optional</span></label>
        ${wizColSelect('label_column')}
      </div>
      <div class="wiz-field-row">
        <label class="wiz-label">Fixed label <span class="wiz-badge-optional">optional</span></label>
        <input type="text" class="wiz-input" name="label" placeholder="e.g. connects to" />
        <span class="wiz-field-hint">Used when no label column is set</span>
      </div>
    </div>
    <div class="wiz-field-row">
      <label class="wiz-label">Tooltip properties <span class="wiz-badge-optional">optional</span></label>
      <div class="wiz-prop-tags">
        ${wizHeaders.map(h => `<button type="button" class="wiz-prop-tag" data-col="${h}" onclick="this.classList.toggle('active')">${h}</button>`).join('')}
      </div>
      <span class="wiz-field-hint">Click columns to show them in the hover tooltip</span>
    </div>`;
  document.getElementById('wiz-edges-list').appendChild(div);
}

// ── Build config from wizard fields ──
function wizBuildConfig() {
  const nodes = [...document.getElementById('wiz-nodes-list').querySelectorAll('.wiz-entity-row')].map(row => {
    const f = (n) => row.querySelector(`[name="${n}"]`)?.value?.trim() || '';
    const nd = { id_column: f('id_column') };
    if (f('label_column')) nd.label_column = f('label_column');
    if (f('type_column'))  nd.type_column  = f('type_column');
    else                   nd.type         = f('type') || 'default';
    const propsEl = row.querySelector('.wiz-prop-tags');
    const props = propsEl ? [...propsEl.querySelectorAll('.wiz-prop-tag.active')].map(t => t.dataset.col) : [];
    if (props.length) nd.properties = props;
    return nd;
  });

  const edges = [...document.getElementById('wiz-edges-list').querySelectorAll('.wiz-entity-row')].map(row => {
    const f = (n) => row.querySelector(`[name="${n}"]`)?.value?.trim() || '';
    const ed = { from_column: f('from_column'), to_column: f('to_column') };
    if (f('label_column')) ed.label_column = f('label_column');
    else if (f('label'))   ed.label        = f('label');
    const propsEl = row.querySelector('.wiz-prop-tags');
    const props = propsEl ? [...propsEl.querySelectorAll('.wiz-prop-tag.active')].map(t => t.dataset.col) : [];
    if (props.length) ed.properties = props;
    return ed;
  });

  return { title: document.getElementById('wiz-title').value.trim() || 'My Scenario', nodes, edges };
}

// ── Wizard file loader ──
function wizLoadFile(evt) {
  const f = evt.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => { document.getElementById('wiz-csv').value = e.target.result; };
  r.readAsText(f);
  evt.target.value = '';
}

function wizShowError(msg) {
  const el = document.getElementById('wiz-error');
  el.textContent = '⚠ ' + msg;
  el.style.display = 'block';
}
function wizClearError() {
  const el = document.getElementById('wiz-error');
  el.textContent = '';
  el.style.display = 'none';
}

// ─────────────────────────────────────────────────────────────
//  Query Sentinel — MSAL.js + Log Analytics REST API
// ─────────────────────────────────────────────────────────────
const KQL_LS_KEY = 'sentinel-kql-settings';
let _msalInstance = null;
let _msalAccount  = null;

function kqlLoadSettings() {
  try { return JSON.parse(localStorage.getItem(KQL_LS_KEY) || '{}'); } catch { return {}; }
}

function kqlPersistSettings(s) {
  localStorage.setItem(KQL_LS_KEY, JSON.stringify(s));
}

function kqlBuildMsal(tenantId, clientId) {
  if (!tenantId || !clientId) return null;
  return new msal.PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin + window.location.pathname
    },
    cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false }
  });
}

function kqlSaveSettings() {
  const s = {
    tenantId:    document.getElementById('kql-tenant').value.trim(),
    clientId:    document.getElementById('kql-client').value.trim(),
    workspaceId: document.getElementById('kql-workspace').value.trim()
  };
  kqlPersistSettings(s);
  _msalInstance = kqlBuildMsal(s.tenantId, s.clientId);
  _msalAccount  = _msalInstance ? (_msalInstance.getAllAccounts()[0] || null) : null;
  kqlUpdateStatus();
}

function kqlUpdateStatus() {
  const statusEl = document.getElementById('kql-login-status');
  const btnEl    = document.getElementById('kql-login-btn');
  if (!statusEl) return;
  if (!_msalInstance) {
    statusEl.textContent = 'Enter Tenant ID and Client ID, then click Save.';
    statusEl.className   = 'kql-status kql-status-warn';
    btnEl.style.display  = 'none';
    return;
  }
  if (_msalAccount) {
    statusEl.innerHTML  = `<i class="fa-solid fa-circle-check"></i> Logged in as <b>${_msalAccount.username}</b>`;
    statusEl.className  = 'kql-status kql-status-ok';
    btnEl.textContent   = 'Logout';
    btnEl.style.display = '';
  } else {
    statusEl.innerHTML  = '<i class="fa-solid fa-circle-xmark"></i> Not logged in.';
    statusEl.className  = 'kql-status kql-status-warn';
    btnEl.textContent   = 'Login';
    btnEl.style.display = '';
  }
}

async function kqlToggleLogin() {
  if (!_msalInstance) { alert('Save settings first.'); return; }
  if (_msalAccount) {
    try { await _msalInstance.logoutPopup({ account: _msalAccount }); } catch {}
    _msalAccount = null;
  } else {
    try {
      const res = await _msalInstance.loginPopup({
        scopes: ['https://api.loganalytics.io/Data.Read']
      });
      _msalAccount = res.account;
    } catch (e) {
      alert('Login failed: ' + e.message);
    }
  }
  kqlUpdateStatus();
}

async function kqlRunQuery() {
  const settings = kqlLoadSettings();
  if (!settings.workspaceId) { kqlSetRunStatus('error', 'Workspace ID is required.'); return; }
  if (!_msalInstance || !_msalAccount) { kqlSetRunStatus('error', 'Please login first.'); return; }
  const query = document.getElementById('kql-query').value.trim();
  if (!query) { kqlSetRunStatus('error', 'Query is empty.'); return; }

  kqlSetRunStatus('', 'Running query…');
  try {
    let tokenResp;
    try {
      tokenResp = await _msalInstance.acquireTokenSilent({
        scopes: ['https://api.loganalytics.io/Data.Read'],
        account: _msalAccount
      });
    } catch {
      tokenResp = await _msalInstance.acquireTokenPopup({
        scopes: ['https://api.loganalytics.io/Data.Read'],
        account: _msalAccount
      });
    }

    const resp = await fetch(
      `https://api.loganalytics.io/v1/workspaces/${settings.workspaceId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResp.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${resp.status}`);
    }

    const data  = await resp.json();
    const table = data.tables?.[0];
    if (!table || !table.rows?.length) throw new Error('Query returned no rows.');

    const csv = kqlTableToCSV(table);
    document.getElementById('editor-data').value = csv;
    kqlSetRunStatus('ok', `✓ ${table.rows.length} rows loaded — switch to Data (CSV) tab to review, then Apply & Visualize.`);
    switchEditorTab('data');
  } catch (e) {
    kqlSetRunStatus('error', e.message);
  }
}

function kqlTableToCSV(table) {
  const header = table.columns.map(c => kqlCsvEsc(c.name)).join(',');
  const rows   = table.rows.map(r => r.map(v => kqlCsvEsc(String(v ?? ''))).join(','));
  return [header, ...rows].join('\n');
}

function kqlCsvEsc(val) {
  return (val.includes(',') || val.includes('"') || val.includes('\n'))
    ? '"' + val.replace(/"/g, '""') + '"'
    : val;
}

function kqlSetRunStatus(type, msg) {
  const el = document.getElementById('kql-run-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'kql-status' + (type === 'ok' ? ' kql-status-ok' : type === 'error' ? ' kql-status-err' : '');
}

function kqlInit() {
  const s = kqlLoadSettings();
  if (s.tenantId)    document.getElementById('kql-tenant').value    = s.tenantId;
  if (s.clientId)    document.getElementById('kql-client').value    = s.clientId;
  if (s.workspaceId) document.getElementById('kql-workspace').value = s.workspaceId;
  _msalInstance = kqlBuildMsal(s.tenantId, s.clientId);
  _msalAccount  = _msalInstance ? (_msalInstance.getAllAccounts()[0] || null) : null;
  kqlUpdateStatus();
}

// ─────────────────────────────────────────────────────────────
//  Boot
renderMyExamplesList();
loadExample('login');
kqlInit();

if (localStorage.getItem('sentinel-graph-skip-intro') === '1') {
  const overlay = document.getElementById('intro-overlay');
  overlay.style.display = 'none';
}
