# SIDECAR ARCHITECTURE
> Status: `ACTIVE` | Version: `1.0.0` | Owner: `@jesse`
> Part of: DevPulse Platform | Module: `engine/src/sidecar/`

---

## Purpose

Sidecars are standalone binaries that DevPulse spawns as child processes.
They are independently updatable — the user can update a sidecar without
reinstalling or rebuilding the full application.

**Core invariant:** The main Tauri app is a thin shell. Heavy or frequently
updated subsystems run as sidecars. The main app communicates with them
over a typed IPC channel (stdin/stdout JSON-RPC 2.0).

---

## What Is a Sidecar

```
DevPulse.exe (Tauri shell)
    │
    ├── spawns → devforge.exe        (project scaffolding + analysis)
    ├── spawns → wiredfront.exe      (P2P + audio editor)
    ├── spawns → pixvix.exe          (screen capture pipeline)
    └── spawns → mcp-server.exe      (MCP tool server)
```

Each sidecar:
- Is a separate Rust binary in the workspace
- Ships alongside the main app in resources/sidecars/
- Can be replaced on disk without touching the main app
- Communicates over stdin/stdout JSON-RPC 2.0
- Has its own version number and update channel

---

## Tauri Sidecar Configuration

### `tauri.conf.json`

```json
{
  "bundle": {
    "resources": {
      "sidecars/devforge-x86_64-pc-windows-msvc.exe": "devforge.exe",
      "sidecars/wiredfront-x86_64-pc-windows-msvc.exe": "wiredfront.exe",
      "sidecars/pixvix-x86_64-pc-windows-msvc.exe": "pixvix.exe",
      "sidecars/mcp-server-x86_64-pc-windows-msvc.exe": "mcp-server.exe"
    }
  }
}
```

### `capabilities/sidecar.json`

```json
{
  "identifier": "sidecar-permissions",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [
        { "name": "devforge", "sidecar": true },
        { "name": "wiredfront", "sidecar": true },
        { "name": "pixvix", "sidecar": true },
        { "name": "mcp-server", "sidecar": true }
      ]
    }
  ]
}
```

---

## Sidecar IPC Protocol

Each sidecar speaks JSON-RPC 2.0 over stdin/stdout.
Engine spawns, writes requests, reads responses per line.

```rust
// engine/src/sidecar/mod.rs

#[derive(Serialize)]
pub struct SidecarRequest {
    pub jsonrpc: &'static str,  // "2.0"
    pub id: u64,
    pub method: String,
    pub params: serde_json::Value,
}

#[derive(Deserialize)]
pub struct SidecarResponse {
    pub jsonrpc: String,
    pub id: u64,
    pub result: Option<serde_json::Value>,
    pub error: Option<SidecarError>,
}
```

---

## Sidecar Registry

```rust
// engine/src/sidecar/registry.rs

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum SidecarId {
    DevForge,
    WiredFront,
    PixVix,
    McpServer,
}

impl SidecarRegistry {
    pub async fn spawn_all(&mut self) -> anyhow::Result<()> {
        // DevForge + MCP spawn at startup
        self.spawn(SidecarId::DevForge, "devforge").await?;
        self.spawn(SidecarId::McpServer, "mcp-server").await?;
        // WiredFront + PixVix spawn on-demand only
        Ok(())
    }
}
```

---

## Workspace Layout

```
platform_devpulse/
├── Cargo.toml                  ← workspace root
├── crates/
│   ├── engine/                 ← non-AI infrastructure
│   ├── kernel/                 ← MAESTRO + AI pipeline (private/encrypted)
│   ├── shared/                 ← types shared across all crates
│   └── model-loader/           ← extractable, zero DevPulse deps
├── sidecars/
│   ├── devforge/               ← Cargo binary, JSON-RPC server
│   ├── wiredfront/             ← Cargo binary
│   ├── pixvix/                 ← Cargo binary
│   └── mcp-server/             ← Cargo binary
├── app/                        ← Tauri frontend (Svelte 5 runes)
└── docs/
```

---

## Hot Update Flow

```
1. Updater downloads new sidecar binary to temp path
2. Engine signals SidecarRegistry: update pending
3. SidecarRegistry drains in-flight requests
4. Old process terminated
5. New binary moved into place
6. New process spawned
7. Engine resumes routing
8. Clyffy: "DevForge updated in the background."
```

No app restart. No rebuild. ~30-60 second window.

---

## Engine vs Sidecar vs Kernel Boundary

| Component | Location | Reason |
|---|---|---|
| Signal bus | `engine/` | Core infra, not hot-updated |
| Storage Trinity adapters | `engine/` | Core infra |
| Model slot registry | `engine/` | Core infra |
| DevForge | `sidecars/devforge/` | Frequently updated, independent |
| WiredFront P2P | `sidecars/wiredfront/` | Large, optional, independent |
| PixVix capture | `sidecars/pixvix/` | Platform-specific, updated often |
| MCP server | `sidecars/mcp-server/` | Tool definitions change frequently |
| MAESTRO kernel | `kernel/` | Private, encrypted, never sidecar |
| Rosetta encoder | `kernel/` | Private AI logic |
| Minion inference | `kernel/` | Private AI logic |
| Lexicon (voice) | `kernel/` | Private AI logic |
| Forge (JIT context) | `kernel/` | Private AI logic |
| Engram memory system | `kernel/` | Private AI logic |

---

*See also: NEUROCORTEX.md (kernel boundary), ADR.md (sidecar decision)*
