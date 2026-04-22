//! # Claude Integration — All Paths
//!
//! Lives in `engine/src/claude/mod.rs`
//!
//! ## Three Connection Modes
//!
//! DevPulse supports every way to connect Claude:
//!
//! | Mode               | Who Uses It     | Transport    | Feature Gate     |
//! |--------------------|-----------------|--------------|------------------|
//! | Sidecar            | Jesse (dev)     | MCP (SSE)    | internal         |
//! | Claude Code CLI    | Jesse (dev)     | MCP (stdio)  | internal         |
//! | API-Enhanced       | End users       | HTTP API     | always available |
//!
//! All three connect to the SAME DevPulse infrastructure:
//! - Same databases (libSQL, SurrealDB, DuckDB, Qdrant)
//! - Same signal bus (tokio::broadcast)
//! - Same model slots
//! - Same lane tracing
//!
//! The difference is transport and security boundary:
//! - Sidecar + Claude Code: full 32-tool MCP surface (#[cfg(feature = "internal")])
//! - API-Enhanced: 5 project-scoped tools, orchestrator mediates everything
//!
//! ## Architecture
//!
//! ```text
//!                    ┌─────────────────────────────────┐
//!                    │     DevPulse MCP Server          │
//!                    │     localhost:9315 (SSE)          │
//!                    │     + stdio for Claude Code       │
//!                    │     32 tools (internal builds)    │
//!                    └──────────┬──────────┬─────────────┘
//!                               │          │
//!              ┌────────────────┤          ├────────────────┐
//!              │                │          │                │
//!              ▼                ▼          ▼                ▼
//!     ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
//!     │ Claude       │ │ Claude   │ │ Browser  │ │ Claude API   │
//!     │ Desktop      │ │ Code     │ │ claude.ai│ │ (users)      │
//!     │ (sidecar)    │ │ (CLI)    │ │ (MCP)    │ │ via engine   │
//!     └──────────────┘ └──────────┘ └──────────┘ └──────────────┘
//!      #[cfg(internal)]  #[cfg(internal)]  #[cfg(internal)]   always
//! ```

pub mod mcp;

use serde::{Deserialize, Serialize};

// ═════════════════════════════════════════════════════════════
// UNIFIED CONFIG
// ═════════════════════════════════════════════════════════════

/// Complete Claude integration config.
/// Covers all three connection modes.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(Default)]
pub struct ClaudeConfig {
    /// Sidecar: Claude Desktop bundled as child process
    pub sidecar: SidecarConfig,

    /// Claude Code: CLI tool connects via stdio MCP
    pub claude_code: ClaudeCodeConfig,

    /// API-Enhanced: user-facing provider (always available)
    pub api: ApiProviderConfig,

    /// MCP server: shared by sidecar + Claude Code + browser
    pub mcp: McpServerConfig,

    /// Browser automation: Claude in Chrome, open Lovable/Bolt/Cursor
    pub browser: BrowserAutomationConfig,
}

// ─────────────────────────────────────────────────────────────
// MODE 1: Sidecar (subscription Claude Desktop)
// ─────────────────────────────────────────────────────────────

/// Claude Desktop runs as a managed child process of `DevPulse`.
/// Jesse's subscription, full thinking/artifacts/MCP.
/// Feature-gated: only exists in internal builds.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarConfig {
    /// Enable sidecar mode
    pub enabled: bool,

    /// Sidecar binary name (Tauri appends target triple)
    /// Binary location: src-tauri/binaries/claude-desktop-{triple}.exe
    pub sidecar_name: String,

    /// Args passed to Claude Desktop on launch
    pub launch_args: Vec<String>,

    /// Auto-launch when `DevPulse` starts
    pub auto_launch: bool,

    /// Kill when `DevPulse` exits
    pub kill_on_exit: bool,

    /// Auto-restart on crash
    pub max_restart_attempts: u32,
}

// ─────────────────────────────────────────────────────────────
// MODE 2: Claude Code (CLI, stdio MCP)
// ─────────────────────────────────────────────────────────────

/// Claude Code connects via stdio MCP transport.
/// Jesse runs `claude` in terminal, it auto-discovers `DevPulse`.
/// Feature-gated: config only meaningful in internal builds.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeCodeConfig {
    /// Enable Claude Code integration
    pub enabled: bool,

    /// Auto-configure Claude Code's settings.json with `DevPulse` MCP
    /// On first run, writes to ~/.claude/settings.json:
    /// `{ "mcpServers": { "devpulse": { "command": "devpulse", "args": ["--mcp", "stdio"] } } }`
    pub auto_configure: bool,

    /// Path to Claude Code binary (empty = auto-detect from PATH)
    pub binary_path: String,
}

// ─────────────────────────────────────────────────────────────
// MODE 3: API-Enhanced (user-facing, always available)
// ─────────────────────────────────────────────────────────────

/// User brings their own API key. The engine routes through
/// the processing pipeline: local preprocessing → prompt assembly
/// → provider config → API call → quality check validation.
///
/// This is NOT an MCP connection. The engine calls the
/// Claude/GPT/Gemini API on the user's behalf with
/// pre-enriched context.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiProviderConfig {
    /// Enable API-Enhanced mode
    pub enabled: bool,

    /// Default provider when user has multiple API keys
    pub default_provider: String,

    /// Supported providers and their configs
    pub providers: Vec<ProviderFrame>,
}

/// A single AI provider's connection config and tuning parameters.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderFrame {
    /// Provider ID: "claude", "gpt", "gemini"
    pub id: String,

    /// Display name: "Claude (Anthropic)", "GPT (`OpenAI`)"
    pub display_name: String,

    /// API base URL
    pub api_url: String,

    /// Default model for this provider
    pub default_model: String,

    /// Max tokens for this provider
    pub max_tokens: u32,

    /// Provider-specific quirks and tuning
    /// (stored as key-value pairs, interpreted by the prompt builder)
    #[serde(default)]
    pub tuning: std::collections::HashMap<String, String>,
}

// ─────────────────────────────────────────────────────────────
// MCP SERVER (shared infrastructure)
// ─────────────────────────────────────────────────────────────

/// `DevPulse`'s MCP server. Serves ALL Claude connection modes.
/// Sidecar connects via SSE. Claude Code connects via stdio.
/// Browser claude.ai connects via SSE.
/// All see the same 32 tools (internal builds).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConfig {
    /// Start MCP server on `DevPulse` launch
    pub auto_start: bool,

    /// SSE transport config (sidecar + browser)
    pub sse: SseConfig,

    /// Stdio transport config (Claude Code)
    pub stdio: StdioConfig,

    /// Which tool surface to expose
    pub tool_surface: ToolSurface,
}

/// SSE transport config for MCP server.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SseConfig {
    /// Whether SSE transport is enabled.
    pub enabled: bool,
    /// Port to bind the SSE server on.
    pub port: u16,
    /// Address to bind (always 127.0.0.1 — never 0.0.0.0).
    pub bind: String,
}

/// Stdio transport config for MCP server (used by Claude Code).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[derive(Default)]
pub struct StdioConfig {
    /// Whether stdio transport is enabled.
    pub enabled: bool,
}

/// Which MCP tool surface to expose to connected clients.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolSurface {
    /// All 32 tools (15 `DevPulse` + 17 workstation)
    Full,
    /// 15 DevPulse-internal tools only
    DevpulseOnly,
    /// 17 workstation tools only
    WorkstationOnly,
    /// Custom selection (list of tool names)
    Custom(Vec<String>),
}

// ─────────────────────────────────────────────────────────────
// BROWSER AUTOMATION
// ─────────────────────────────────────────────────────────────

/// Controls how Claude interacts with external tools
/// (Lovable, Bolt, Cursor, VS Code, any browser tab).
///
/// Two mechanisms:
/// 1. Claude in Chrome MCP — browser agent for web-based tools
/// 2. scap + Windows `UIAutomation` — for desktop apps (Cursor, VS Code)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserAutomationConfig {
    /// Enable browser automation (Claude in Chrome)
    pub chrome_agent_enabled: bool,

    /// Enable desktop UI automation (scap + `UIAutomation`)
    pub desktop_agent_enabled: bool,

    /// Tools Claude can launch and interact with
    #[serde(default)]
    pub external_tools: Vec<ExternalToolConfig>,
}

/// Config for an external tool that Claude can launch and interact with.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalToolConfig {
    /// Tool identifier: "lovable", "bolt", "cursor", "vscode"
    pub id: String,

    /// Display name
    pub name: String,

    /// How to launch: "browser" or "desktop"
    pub launch_type: LaunchType,

    /// URL (for browser tools) or exe path (for desktop tools)
    pub target: String,

    /// CSS selector for the prompt input (browser tools)
    pub prompt_selector: Option<String>,

    /// Provider config ID (which prompt builder config to use)
    pub frame_id: String,
}

/// How to launch an external tool.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LaunchType {
    /// Open in Chrome, interact via Claude in Chrome MCP
    Browser,
    /// Launch desktop app, interact via `UIAutomation`
    Desktop,
    /// CLI tool, interact via `shell_execute`
    Cli,
}

// ═════════════════════════════════════════════════════════════
// DEFAULTS
// ═════════════════════════════════════════════════════════════

impl Default for SidecarConfig {
    fn default() -> Self {
        Self {
            enabled: cfg!(feature = "internal"),
            sidecar_name: "claude-desktop".into(),
            launch_args: vec![],
            auto_launch: false,
            kill_on_exit: true,
            max_restart_attempts: 3,
        }
    }
}

impl Default for ClaudeCodeConfig {
    fn default() -> Self {
        Self {
            enabled: cfg!(feature = "internal"),
            auto_configure: true,
            binary_path: String::new(),
        }
    }
}

impl Default for ApiProviderConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            default_provider: "claude".into(),
            providers: vec![
                ProviderFrame {
                    id: "claude".into(),
                    display_name: "Claude (Anthropic)".into(),
                    api_url: "https://api.anthropic.com/v1/messages".into(),
                    default_model: "claude-sonnet-4-20250514".into(),
                    max_tokens: 4096,
                    tuning: std::collections::HashMap::new(),
                },
                ProviderFrame {
                    id: "gpt".into(),
                    display_name: "GPT (OpenAI)".into(),
                    api_url: "https://api.openai.com/v1/chat/completions".into(),
                    default_model: "gpt-4o".into(),
                    max_tokens: 4096,
                    tuning: std::collections::HashMap::new(),
                },
                ProviderFrame {
                    id: "gemini".into(),
                    display_name: "Gemini (Google)".into(),
                    api_url: "https://generativelanguage.googleapis.com/v1beta/models".into(),
                    default_model: "gemini-2.5-flash".into(),
                    max_tokens: 4096,
                    tuning: std::collections::HashMap::new(),
                },
            ],
        }
    }
}

impl Default for SseConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            port: 9315,
            bind: "127.0.0.1".into(),
        }
    }
}


impl Default for McpServerConfig {
    fn default() -> Self {
        Self {
            auto_start: true,
            sse: SseConfig::default(),
            stdio: StdioConfig::default(),
            tool_surface: if cfg!(feature = "internal") {
                ToolSurface::Full
            } else {
                ToolSurface::DevpulseOnly
            },
        }
    }
}

impl Default for BrowserAutomationConfig {
    fn default() -> Self {
        Self {
            chrome_agent_enabled: cfg!(feature = "internal"),
            desktop_agent_enabled: cfg!(feature = "internal"),
            external_tools: vec![
                ExternalToolConfig {
                    id: "lovable".into(),
                    name: "Lovable".into(),
                    launch_type: LaunchType::Browser,
                    target: "https://lovable.dev".into(),
                    prompt_selector: Some("textarea[placeholder]".into()),
                    frame_id: "lovable".into(),
                },
                ExternalToolConfig {
                    id: "bolt".into(),
                    name: "Bolt".into(),
                    launch_type: LaunchType::Browser,
                    target: "https://bolt.new".into(),
                    prompt_selector: Some("textarea".into()),
                    frame_id: "bolt".into(),
                },
                ExternalToolConfig {
                    id: "cursor".into(),
                    name: "Cursor".into(),
                    launch_type: LaunchType::Desktop,
                    target: "cursor".into(),
                    prompt_selector: None,
                    frame_id: "cursor".into(),
                },
                ExternalToolConfig {
                    id: "vscode".into(),
                    name: "VS Code".into(),
                    launch_type: LaunchType::Desktop,
                    target: "code".into(),
                    prompt_selector: None,
                    frame_id: "vscode".into(),
                },
                ExternalToolConfig {
                    id: "claude-code".into(),
                    name: "Claude Code".into(),
                    launch_type: LaunchType::Cli,
                    target: "claude".into(),
                    prompt_selector: None,
                    frame_id: "claude-code".into(),
                },
            ],
        }
    }
}

