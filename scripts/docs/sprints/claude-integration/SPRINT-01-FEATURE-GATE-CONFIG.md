# Sprint 1: Feature Gate + Config SSOT

| Field | Value |
|-------|-------|
| **Parent** | Claude Integration Plan |
| **Status** | `PLANNED` |
| **Depends on** | claude/mod.rs (already authored) |
| **Files** | 5 modified |

---

## PRE-FLIGHT

- [ ] Read `systems/devpulse-engine/Cargo.toml` — verify current features
- [ ] Read `interfaces/desktop/src-tauri/Cargo.toml` — verify devpulse-engine dep + features
- [ ] Read `systems/devpulse-engine/src/claude/mod.rs` — count all `cfg!(feature = "kernel")`
- [ ] Read `systems/devpulse-engine/platform.default.toml` — find insertion point for `[services.system.claude]`
- [ ] Read `systems/devpulse-engine/src/platform/config.rs` — understand PlatformBootConfig

---

## CHANGES

### 1. `systems/devpulse-engine/Cargo.toml`

Add `internal` feature:
```toml
[features]
default = ["kernel"]
kernel = []
engine = []
internal = []  # Jesse's dev build — compiled out of release
rro = ["devpulse-clyffy/rro"]
candle = ["devpulse-clyffy/candle"]
inference = ["devpulse-clyffy/model-loader"]
```

### 2. `interfaces/desktop/src-tauri/Cargo.toml`

Add `internal` feature passthrough:
```toml
[features]
default = ["inference"]
inference = []
internal = ["devpulse-engine/internal"]  # passthrough to engine
```

### 3. `systems/devpulse-engine/src/claude/mod.rs`

Replace ALL `cfg!(feature = "kernel")` with `cfg!(feature = "internal")`.

Expected 6 occurrences:
- SidecarConfig::enabled default
- ClaudeCodeConfig::enabled default
- StdioConfig::enabled default
- ToolSurface conditional
- BrowserAutomationConfig::chrome_agent_enabled default
- BrowserAutomationConfig::desktop_agent_enabled default

### 4. `systems/devpulse-engine/platform.default.toml`

Add after `[services.system.devforge]` section:

```toml
[services.system.claude]
enabled = true
critical = false

[services.system.claude.mcp]
auto_start = true
tool_surface = "full"

[services.system.claude.mcp.sse]
enabled = true
port = 9315
bind = "127.0.0.1"

[services.system.claude.mcp.stdio]
enabled = true

[services.system.claude.sidecar]
enabled = true
sidecar_name = "claude-desktop"
auto_launch = false
kill_on_exit = true
max_restart_attempts = 3

[services.system.claude.claude_code]
enabled = true
auto_configure = true
binary_path = ""

[services.system.claude.api]
enabled = true
default_provider = "claude"

[[services.system.claude.api.providers]]
id = "claude"
display_name = "Claude (Anthropic)"
api_url = "https://api.anthropic.com/v1/messages"
default_model = "claude-sonnet-4-20250514"
max_tokens = 4096

[[services.system.claude.api.providers]]
id = "gpt"
display_name = "GPT (OpenAI)"
api_url = "https://api.openai.com/v1/chat/completions"
default_model = "gpt-4o"
max_tokens = 4096

[[services.system.claude.api.providers]]
id = "gemini"
display_name = "Gemini (Google)"
api_url = "https://generativelanguage.googleapis.com/v1beta/models"
default_model = "gemini-2.5-flash"
max_tokens = 4096

[services.system.claude.lanes.internal]
max_requests_per_minute = 60
max_tokens_per_day = 1_000_000
cooldown_after_429_ms = 5000
cost_cap_daily_usd = 0.0

[services.system.claude.lanes.api]
max_requests_per_minute = 20
max_tokens_per_day = 500_000
cooldown_after_429_ms = 10000
cost_cap_daily_usd = 50.0

[services.system.claude.council]
mode = "rule_based"
prefer_internal = true
escalation_on_rate_limit = true

[services.system.claude.browser]
chrome_agent_enabled = true
desktop_agent_enabled = true
```

### 5. `systems/devpulse-engine/src/platform/config.rs`

Add to PlatformBootConfig (the TOML-driven internal config):
- Import `ClaudeConfig` from `crate::claude`
- Add `pub claude: Option<ClaudeConfig>` field
- Wire deserialization

NOTE: PlatformBootConfig is internal-only (not TS-exported). The `PlatformConfig` (public, TS-exported) does NOT need a claude field — the UI gets claude state via Tauri commands, not via PlatformConfig.

---

## VERIFICATION

- [ ] `cargo check -p devpulse-engine` — 0 errors (no `internal` flag)
- [ ] `cargo check -p devpulse-engine --features internal` — 0 errors
- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors
- [ ] Grep for `cfg!(feature = "kernel")` in claude/mod.rs — 0 hits
- [ ] Grep for `cfg!(feature = "internal")` in claude/mod.rs — 6 hits
- [ ] platform.default.toml has `[services.system.claude]` section
- [ ] platform/config.rs has `claude: Option<ClaudeConfig>`

**If ANY checkbox unchecked, sprint is NOT done.**
