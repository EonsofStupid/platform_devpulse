# POA&M — Council of Clyffy + MCP Server + Tool Registry + Cockpit

| Field | Value |
|-------|-------|
| **Status** | `ACTIVE` |
| **Date** | `2026-04-06` |
| **Scope** | Engine (council, tools, mcp) + Facade (events) + Desktop (UI) |
| **Feature Gate** | `internal` — compiled OUT of release binary |
| **Source Specs** | Council of Clyffy, Claude Code + MCP Integration, Cockpit Layout |

---

## WHAT EXISTS (Verified on Disk)

| Component | Path | State | Lines |
|-----------|------|-------|-------|
| MCP protocol types | `claude/mcp/protocol.rs` | BUILT — JSON-RPC 2.0, MCP init/tools types | 169 |
| MCP handler | `claude/mcp/handler.rs` | BUILT — dispatch, initialize, tools/list (empty), tools/call (stub) | 114 |
| MCP SSE transport | `claude/mcp/transport_sse.rs` | BUILT — axum GET /sse + POST /message on :9315 | 113 |
| MCP stdio transport | `claude/mcp/transport_stdio.rs` | BUILT — tokio stdin/stdout, `#[cfg(internal)]` | 64 |
| MCP server lifecycle | `claude/mcp/mod.rs` | BUILT — start/stop, feature-gated | 57 |
| Claude config types | `claude/mod.rs` | BUILT — all config structs + defaults | ~500 |
| Governance signals | `signals/payloads.rs` | BUILT — GovernancePayload + GovernanceEvent | Added |
| Governance variant | `signals/variants.rs` | BUILT — Governance variant, sinks, name | Added |
| Config SSOT | `platform.default.toml` | BUILT — `[services.system.claude]` full section | Added |
| Config entry | `platform/config.rs` | BUILT — ClaudeServiceEntry, lanes, council types | Added |
| `internal` feature | `Cargo.toml` | BUILT — engine + tauri passthrough | Added |
| EventFacade | `platform/facade/` | BUILT — dual-view translation, bridge, filters | Exists |
| EventCategory | `platform/facade/events.rs` | BUILT — GovernanceDecision category exists | Exists |

## WHAT DOES NOT EXIST (Must Build)

| Component | Planned Path | Spec Source |
|-----------|-------------|-------------|
| **Council dispatch** | `engine/src/council/dispatch.rs` | Council spec §4 |
| **Council synthesis** | `engine/src/council/synthesis.rs` | Council spec §4 |
| **Council config** | `engine/src/council/config.rs` | Council spec §6 |
| **Council mod** | `engine/src/council/mod.rs` | Council spec §2 |
| **Tool registry** | `engine/src/tools/mod.rs` | Claude Code spec §6 |
| **Claude Code subprocess** | `engine/src/tools/claude_code/subprocess.rs` | Claude Code spec §4 |
| **Claude Code stream parser** | `engine/src/tools/claude_code/stream.rs` | Claude Code spec §4 |
| **Claude Code MCP registration** | `engine/src/tools/claude_code/mcp.rs` | Claude Code spec §3B |
| **MCP tool implementations** | `claude/mcp/tools/*.rs` | Claude Code spec §5 |
| **API provider client** | `engine/src/tools/claude_api/` | Council spec §4 |
| **Provider frame assembly** | `engine/src/tools/claude_api/frames/` | Council spec §4 |
| **Council overlay (Svelte)** | `domains/app/devpulse/features/council/` | Cockpit spec §4 |
| **Tool status panel (Svelte)** | `domains/app/devforge/features/tools/` | Cockpit spec §3.1 |
| **MAESTRO council config UI** | `domains/app/settings/features/council/` | Cockpit spec §3.2 |
| **Window layout manager** | `engine/src/cockpit/` or `src-tauri/src/commands/windows/` | Cockpit spec §5 |
| **Council signals** | `shared/src/contracts/signal.rs` | Council spec §8 |

---

## BLOCKED ITEMS

| ID | Item | Blocker | Impact | Workaround |
|----|------|---------|--------|------------|
| B1 | MCP protocol version | Code says `2024-11-05`, spec says `2025-06-18`. Streamable HTTP replaces old SSE transport. | Newer clients may reject old version | **UPDATE REQUIRED**: Change to `2025-06-18`, update SSE to Streamable HTTP (POST /mcp returns SSE or JSON) |
| B2 | Council synthesis model | Needs chat.brain slot loaded OR API provider configured | Synthesis fails if no model | Rule: synthesis falls back to best available provider. If none → return raw votes without synthesis |
| B3 | reqwest for API providers | Not in engine Cargo.toml | Can't call Claude/GPT/Gemini APIs | Add `reqwest` with `rustls-tls` feature |
| B4 | Claude Desktop .exe location | `C:\Users\jessa\AppData\Local\Programs\Claude\` — need to verify exact path | Sidecar can't launch | Detect via PATH scan + known install locations |
| B5 | Claude Code CLI binary | `claude-cli-nodejs` found in AppData but `claude` not in PATH from bash | Headless subprocess fails | Detect via `where claude` in PowerShell, or scan AppData |
| B6 | rkyv integration for MCP | ADR says rkyv 0.8.15 internal, JSON at perimeter. MCP is a perimeter. | MCP stays JSON-RPC. rkyv is for internal hot path (Forge→Cortex). | No action — MCP uses JSON-RPC as specified. rkyv for internal only. |
| B7 | Scribe pipeline | Council output feeds Scribe Draft stage. Scribe not built yet. | Council can recommend but can't auto-execute | Council returns recommendation to UI. Execute is manual until Scribe ships. |
| B8 | Minion roster | Council dispatches to DIARY, GUARDIAN, ENFORCER etc. Minion subprocess system not built. | Council can't query minions | Minion fan-out stubs that return "minion not available". Build real minion system in separate sprint. |

---

## RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MCP Streamable HTTP breaking change | HIGH | Old SSE clients won't connect to new transport | Support BOTH old SSE + new Streamable HTTP during transition. Feature-detect client. |
| Council API cost runaway | Medium | User triggers Full Council repeatedly → $$ | Per-invocation cost estimate BEFORE dispatch. Budget caps in config. Hard stop per day. |
| Claude Code process orphaning | Medium | Headless subprocess survives parent | Job Object (Windows) already handles this. Also explicit SIGTERM on shutdown. |
| Parallel API timeouts | Medium | One slow provider blocks synthesis | Independent timeouts per source. Abstain vote on timeout. Synthesis proceeds without. |
| Origin validation missing on SSE | HIGH | DNS rebinding attack vector | **MUST ADD**: Validate `Origin` header on POST /mcp per MCP spec. Reject non-localhost. |
| API keys in memory | Medium | Keys held in process memory during API calls | Keys read from keyring per-call, not cached in state. Clear after use. |
| Tool registry exposes too much in release | Medium | Release build accidentally exposes workstation tools | All workstation tools `#[cfg(feature = "internal")]`. Compile-time guarantee. |

---

## WARNINGS (Documented, Not False Positives)

| Warning | Category | Action |
|---------|----------|--------|
| MCP protocol version `2024-11-05` is outdated | REAL — spec now at `2025-06-18` | Update in Sprint 1 |
| SSE transport uses old pattern (GET /sse + POST /message) | REAL — new spec uses POST /mcp with Streamable HTTP | Migrate in Sprint 1 |
| Missing `Origin` header validation | SECURITY — MCP spec requires this | Add in Sprint 1 |
| Missing `Mcp-Session-Id` support | SPEC GAP — new protocol requires session management | Add in Sprint 2 |
| `tools/list` returns empty array | EXPECTED — tool registry not wired yet | Sprint 3 wires it |
| `tools/call` returns "not implemented" | EXPECTED — tool registry not wired yet | Sprint 3 wires it |
| No `notifications/initialized` handling | SPEC GAP — client sends this after init | Add acknowledgment in Sprint 1 |
| Council config table doesn't exist in libSQL | EXPECTED — schema not deployed | Sprint 4 creates schema |
| Minion fan-out will fail | EXPECTED — minion system not built | Stubs return "not available" |

---

## MILESTONES

| Sprint | Milestone | Gate | Est. Files |
|--------|-----------|------|-----------|
| 1 | MCP protocol upgrade to `2025-06-18` + Streamable HTTP + Origin validation | Protocol handshake works with latest Claude Code | 4 modified |
| 2 | MCP session management + `notifications/initialized` | Session ID flows correctly | 3 modified |
| 3 | Tool registry + first 5 MCP tools (real, not stubs) | `tools/list` returns 5, `tools/call` executes | 6 new, 1 modified |
| 4 | Council engine — dispatch + synthesis + config | Council deliberation works with mock votes | 4 new |
| 5 | API provider client — reqwest to Claude/GPT/Gemini | API call returns response, lane rate limiter active | 4 new, 1 modified |
| 6 | Claude Code subprocess — headless launch + stream parse | Claude Code executes prompt, events stream back | 3 new |
| 7 | Council overlay UI (Svelte) | Votes stream to overlay, synthesis displayed | 4 new |
| 8 | Tool status panel + MAESTRO config UI | Tools visible in DevForge, council configurable | 4 new |
| 9 | Claude Desktop + Claude Code binary detection + launch | Both detected and launchable from DevPulse | 2 new |
| 10 | Window layout manager | Layout presets position windows | 2 new |
| 11 | Remaining 27 MCP tools (batched) | `tools/list` returns 32 | ~27 new |

---

## SPRINT DEPENDENCY GRAPH

```
Sprint 1 (MCP protocol upgrade)
    │
    ├── Sprint 2 (MCP sessions)
    │       │
    │       └── Sprint 3 (Tool registry + first tools)
    │               │
    │               ├── Sprint 6 (Claude Code subprocess)
    │               │
    │               └── Sprint 11 (Remaining 27 tools)
    │
    └── Sprint 5 (API provider client)
            │
            └── Sprint 4 (Council engine)
                    │
                    ├── Sprint 7 (Council overlay UI)
                    │
                    └── Sprint 8 (Tool status + MAESTRO config)

Sprint 9 (Binary detection) — independent, can run anytime
Sprint 10 (Window layouts) — independent, can run anytime
```

---

## ABSOLUTE RULES

1. **`internal` feature compiles OUT** — physically absent from release binary
2. **DevPulse IS the router** — reqwest to APIs directly, no proxy
3. **Council is the architecture** — Claude Code is ONE tool, not the system
4. **MCP spec compliance** — `2025-06-18` protocol, Streamable HTTP, Origin validation
5. **API keys NEVER in logs** — masked previews only, keyring per-call
6. **rkyv internal, JSON at perimeter** — MCP uses JSON-RPC, internal hot path uses rkyv
7. **EventFacade for all tool events** — dual-view narration, no direct UI coupling
8. **GovernancePayload for all council/lane decisions** — every decision is a signal
9. **Max 5 files per sprint** — state plan, wait for approval between sprints
10. **Warnings documented faithfully** — if gap exists, capture it, don't hide it

---

## OPEN QUESTIONS FOR OWNER (from specs)

### From Council Spec §11:
1. Should Council be invocable by minions? (GUARDIAN detects drift → auto-invoke)
2. Cost display: show estimate BEFORE or AFTER dispatching API calls?
3. Custom "voices" — persona prompts ("Think like John Carmack")?
4. Rate limiting: max council invocations per hour?

### From Claude Code Spec §11:
1. Auto-generate `.mcp.json` from DevPulse installer, or manual?
2. Unexpected file changes from headless CC — auto-revert or flag?
3. Session resumption (`--resume`) across sprint tasks?
4. Auto-generate `CLAUDE.md` from project context?
5. Gemini CLI as parallel execution target?

### From Cockpit Spec §11:
1. Auto-launch VS Code when user opens project?
2. How many default window layout presets?
3. Tool detection: registry scan, PATH scan, or both?
4. MCP server keeps running when DevPulse minimizes to tray?
5. Multi-monitor auto-detection for layout presets?

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-04-06 | Initial POA&M from 3 architecture specs |
