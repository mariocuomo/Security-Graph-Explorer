# Security Graph Explorer

> **Community tool — not an official Microsoft product.**

A lightweight, browser-based tool that transforms tabular security data (CSV exports from **Microsoft Defender XDR** or **Microsoft Sentinel**) into interactive, explorable graphs — with no backend, no data lake, and no infrastructure required.


---

## Why This Exists

Microsoft Sentinel ships a powerful built-in investigation graph, but it lives on top of a full Log Analytics data lake. **Security Graph Explorer** fills the gap for teams that want graph-based investigation without that infrastructure — or for anyone who just exported 300 rows from Advanced Hunting and wants to see the lateral movement at a glance.

If your data has a *from* and a *to*, you can visualize it here. The tool is also used as a **general-purpose graph modeler** for service maps, org charts, pipeline flows, and more.

---

## Features

- **20 built-in security scenarios** — logon maps, lateral movement, process trees, email threats, AD recon, registry persistence, cloud sign-ins, and more
- **Custom graphs** — define any graph from any CSV using a small JSON config
- **GQL filter bar** — query the rendered graph to highlight paths, filter node types, and explore blast radius
- **Wizard** — step-by-step UI for building a new graph scenario without editing JSON by hand
- **Save & export** — persist graphs to `localStorage`, export as `.graph.json`, import bundles
- **Cluster nodes** — double-click a node to collapse its neighbours by type; right-click a cluster to expand
- **KQL button** — view the original KQL query for any built-in scenario directly in the toolbar
- **Zero dependencies** at runtime — pure HTML + CSS + JS, works from a local file

---

## Project Structure

```
├── index.html                 # Main application
├── app.js                     # All application logic
├── style.css                  # Styles
├── how-to-create-a-graph.html # Documentation page
├── sentinel-graphs.json       # Graph bundles (config + CSV data)
├── Update-SentinelGraphs.ps1  # PowerShell script: injects CSV files into the JSON
└── data/                      # Drop your exported CSV files here
    ├── Identity Logon Map.csv
    ├── Network Lateral Movement.csv
    └── ...
```

---

## Quick Start

1. **Clone or download** this repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox).
3. Click a built-in example in the sidebar — the graph renders immediately with sample data.

No build step. No npm install. No server needed.

---

## Loading Your Own Security Data

### Manual workflow (recommended)

| Step | Action |
|------|--------|
| 1 | Run your KQL query in **Defender XDR → Advanced Hunting** or **Sentinel → Logs** |
| 2 | Export the results as **CSV** using the Export button |
| 3 | Rename the file to the **exact graph name** (e.g. `Identity Logon Map.csv`) |
| 4 | Place it in the `data/` folder |
| 5 | Run `.\Update-SentinelGraphs.ps1` |
| 6 | Re-open (or refresh) `index.html` and import `sentinel-graphs.json` |

### PowerShell script

```powershell
.\Update-SentinelGraphs.ps1
```

The script scans the `data/` folder, matches each CSV filename (case-insensitive) to the corresponding graph name in `sentinel-graphs.json`, and injects the CSV content into the `csv` field. No authentication, no network calls — pure local file I/O.

Optional parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-JsonPath` | `sentinel-graphs.json` | Path to the JSON bundle file |
| `-DataFolder` | `data/` | Folder containing the CSV exports |

---

## Built-In Graph Scenarios

| Icon | Scenario | Key Tables |
|------|----------|------------|
| 🔑 | **Identity Logon Map** | `IdentityLogonEvents` |
| 🕸️ | **Network Lateral Movement** | `DeviceNetworkEvents` |
| 📧 | **Email Threat Map** | `EmailAttachmentInfo` |
| ☁️ | **Cloud App Sign-in Risk** | `SigninLogs` |
| ⚙️ | **Process Ancestry Tree** | `DeviceProcessEvents` |
| 🗂️ | **Process File Activity** | `DeviceFileEvents` |
| 🔧 | **Registry Persistence Tracker** | `DeviceRegistryEvents` |
| 🔍 | **AD Reconnaissance Map** | `IdentityQueryEvents` |
| 👤 | **Active Directory Changes** | `IdentityDirectoryEvents` |
| 📂 | **Cloud App File Activity** | `CloudAppEvents` |
| ⚠️ | **User Risk Events** | `AADUserRiskEvents` |
| 🚫 | **Device Logon Failures** | `DeviceLogonEvents` |
| 🌐 | **DNS Query Graph** | `ASimDnsActivityLogs` |
| 🔒 | **Non-Interactive Sign-ins** | `AADNonInteractiveUserSignInLogs` |
| 📡 | **Process Network Connections** | `DeviceNetworkEvents` |
| 🛡️ | **Kerberos vs NTLM Auth Map** | `IdentityLogonEvents` |
| 👑 | **Cloud Admin Operations** | `CloudAppEvents` |
| 🔏 | **Sensitive File Access** | `DeviceFileEvents` |
| 🎯 | **Threat Intelligence DNS Hits** | `ASimDnsActivityLogs` |
| 💥 | **Group Membership Changes** | `IdentityDirectoryEvents` |

---

## Defining a Custom Graph

Every graph is described by a JSON config object. The minimum viable config:

```json
{
  "title": "My Graph",
  "icon": "key",
  "nodes": [
    { "id_column": "user",    "type": "user"    },
    { "id_column": "machine", "type": "machine" }
  ],
  "edges": [{
    "from_column":  "user",
    "to_column":    "machine",
    "label_column": "action",
    "color_map": {
      "LogonSuccess": "#10b981",
      "LogonFailed":  "#ef4444"
    }
  }]
}
```

Pair it with a CSV that has the declared column names:

```csv
timestamp,user,machine,action
2025-07-01 08:10,alice,PC-ALICE-01,LogonSuccess
2025-07-01 10:55,charlie,SRV-DC-01,LogonFailed
```

### Node properties

| Property | Required | Description |
|----------|----------|-------------|
| `id_column` | ✅ | CSV column whose values become the node ID and label |
| `type` | — | Fixed node type (`user`, `machine`, `ip`, `file`, `process`, `alert`, `cloud`, `group`, `server`, `domain`, `registry`, `hash`, `url`) |
| `type_column` | — | Use a CSV column to set the type per row (overrides `type`) |
| `label_column` | — | CSV column to use as the visible label (defaults to `id_column`) |
| `properties` | — | Array of CSV column names to show in the hover tooltip |

### Edge properties

| Property | Required | Description |
|----------|----------|-------------|
| `from_column` | ✅ | Source node column |
| `to_column` | ✅ | Target node column |
| `label_column` | — | CSV column used as the edge label |
| `label` | — | Fixed label (used when no `label_column` is set) |
| `color_map` | — | Object mapping label values to hex colours |
| `properties` | — | Array of CSV column names to show in the edge tooltip |

### Icon codes

Use short ASCII codes in the `"icon"` field — they are resolved to emoji by the app and never corrupted by PowerShell's JSON serialization:

`folder` `key` `web` `alert` `email` `bug` `desktop` `globe` `search` `shield` `warning` `lock` `cloud` `gear` `target` `fire` `skull` `chart` `wrench` `files` `block` `radar` `crown` `lockfile` `person` `openfolder` `blast`

---

## Contributing

Contributions are welcome — especially new graph scenarios. To add one:

1. Add a new bundle entry in `sentinel-graphs.json` with a `config` and example `csv`
2. Add the matching KQL query in the `config.query` field so users can reproduce it
3. Add a sample CSV to `data/` using the graph name as filename

Please open a pull request with a brief description of the scenario and the table it queries.

---

## Disclaimer

This is a **community tool** built and maintained independently — it is not an official Microsoft product and is not affiliated with, endorsed by, or supported by Microsoft Corporation. Use it at your own risk. Data processed by this tool stays entirely in your browser and is never transmitted to any external service.

---

*Built by [Mario Cuomo](https://github.com/mariocuomo) · [LinkedIn](https://www.linkedin.com/in/mario-cuomo)*
