---
id: 0001
boundary: engine
paths:
  - systems/devpulse-engine/src/platform/onboarding/
  - kernel/devpulse-clyffy/src/agents/
  - interfaces/desktop/src-tauri/src/commands/onboarding/
  - interfaces/desktop/src/lib/domains/app/onboarding/
touches: [kernel-clyffy, kernel-model-loader, desktop-tauri, desktop-onboarding, desktop-models, desktop-chat, desktop-coldlight]
status: draft
owner: Jesse Hades Hall
created: 2026-10-10
updated: 2026-10-12
supersedes: []
specs:
  - scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md          # owner dictation, SSOT for model-loader UX
  - .claude/plans/coldlight-recovery/07-wizard-recode-spec.md    # owner's binding wizard requirements
  - docs/PLATFORM_SPEC_LAYMAN.md
  - .plan/0006-desktop-coldlight--rebuild-preset-system.md
---

# Rebuild onboarding: engine-owned capability lifecycle over endpoints

## Goal

Every AI capability — Brain, Vision, Voice (listening + speaking), Memory —
can be installed, configured, maintained, and removed from the UI with a
click, and authored as one folder. Every capability is an **endpoint**,
running embedded on this machine or on a server, reached over HTTPS (tier 1)
or a private network — WireGuard, mesh, VPN — when one exists (tier 2). The
**engine** owns this as the onboarding boundary; it writes the resulting AI
configuration into the **kernel**, which holds configuration only.

The user's own **subscriptions — Claude, Codex/ChatGPT, Gemini, Cursor — are
first-class Brains**, used to their full capacity and side by side in **one
clear chat** (Part B). Onboarding connects the Brain (a subscription, a local
runtime, or a network endpoint) and feeds the developer profile from the
user's projects and GitHub (plan 0004 Part C). Vision, Voice and Memory are
maintained in the Model Loader and offered later by guides when a real signal
shows the user needs them (plan 0004, onboarding scope).

## Owner requirements (binding — see sources)

From `MODEL-LOADER-UX-REQUIREMENTS.md` (2026-04-04, direct dictation):

1. Friendlier than OpenWebUI / LM Studio / Jan.ai — zero jargon by default.
2. Vision a first-class card; 3. Voice a first-class card (Listening + Speaking, preview, mic, push-to-talk).
4. Configuration updates the existing record in GlobalDb — never creates new; live UI via events.
5. Consumer product: first-run detects hardware → recommends → one-click install; no terminal; plain English; resume failed downloads; real progress, no fake spinners; offline works; undo ("go back to previous").
6. Four sections minimum: Brain, Vision, Voice, Memory.
7. Advanced view behind a feature flag — everything layered, nothing deleted.

From `07-wizard-recode-spec.md` (2026-07-13): real scan that actually tries
local and network AI services; **no mock — a message only when it is true and
happened**; signals behind every UI line; tooltips everywhere; components as
colocated variants of base blocks; generated ColdLight tokens only; crisp
edges, zero halos; animated backdrop variations.

From the owner (2026-10-10): onboarding is an engine boundary that configures
the kernel; everything is an endpoint; tier 1 HTTPS → tier 2 private network.

From the owner (2026-10-12): "we are bringing their subscription to be easily
used and maximized and capable of working codex with grok and claude in one
clear chat" — subscriptions named: Claude, Cursor, Gemini, Codex/ChatGPT.
Onboarding feeds the user's projects and GitHub into profile stats. Anything
that drives an AI connection is kernel work; the engine is the facade.

## Context (verified 2026-10-10)

- Current wizard (June 7, pre-spec) breaks most requirements: jargon,
  per-tile Apply, Svelte orchestrating installs, no resume.
- Later history has a 07-spec scan (`endpoint_discovery.rs`, 391 lines:
  saved → configured → this machine → mDNS → Tailscale mesh, bounded probing,
  `clyffy.discovery` signals) that only recognized a Clyffy server — to be
  ported and generalized.
- A first OpenAI-compatible probe was drafted in `kernel/devpulse-clyffy/src/endpoints/`
  (uncommitted). Probing is a process, not configuration — it moves into the
  engine boundary in phase 1.
- Kernel `interactions` module calls the Setup Wizard an interaction
  template — overlaps this boundary; see Decisions.

## Structure — authored and plug-and-play

Lifecycle per capability follows the **reconcile loop** (desired state vs
observed state → install / repair / update / remove), the pattern Kubernetes
operators use to install *and maintain*. Capabilities are **declarative
manifests**, like package formulae: adding one is a folder, not code changes.

```text
systems/devpulse-engine/src/platform/onboarding/      the boundary (engine)
  mod.rs               facade: start / choose / retry / skip / snapshot; capability registry
  workflow.rs          first-run flow: detect → scan → recommend → install → confirm → complete
  reconcile.rs         desired vs observed per capability: install, repair, update, remove, undo
  store.rs             GlobalDb checkpoints + config history (resume, undo)
  events.rs            typed snapshot + scan/progress events; tracing target 1:1
  connectivity/        how an endpoint is reached
    mod.rs             Tier: Https (1) → PrivateNetwork (2)
    https.rs
    private_network.rs WireGuard / mesh (Tailscale, Headscale) / VPN detection + peers
  discovery/           finding endpoints — one file per source
    saved.rs  configured.rs  this_machine.rs  home_network.rs  private_network.rs
  probes/              identifying protocols — one file per protocol
    openai_compatible.rs  anthropic.rs  clyffy.rs
                       (local runtimes are installed and supervised by plan 0007's
                       kernel runtime adapter; onboarding only decides desired state)
  capabilities/        one folder per capability — the authoring surface
    brain/   vision/   voice-listening/   voice-speaking/   memory/
      capability.toml  layman copy, protocol, install methods, health check, hardware fit
      mod.rs           optional hooks

kernel/devpulse-clyffy/src/config/                    receives AI configuration only
kernel/devpulse-clyffy/src/agents/                    subscription agents over ACP (Part B)
  mod.rs        facade: list, connect, sessions
  client.rs     ACP client (official `agent-client-protocol` crate) over the agent's stdio
  catalog.rs    agent catalog from `config/agents.default.toml` + user overrides
  sessions.rs   thread ↔ ACP session ids (resume via `session/load`)
interfaces/desktop/src-tauri/src/commands/onboarding/ intents + event forwarding only
interfaces/desktop/src-tauri/src/commands/agents/     chat intents; session updates over typed Channel
interfaces/desktop/src/lib/domains/app/onboarding/    presentational UI (first run)
interfaces/desktop/src/lib/domains/app/models/        Model Loader: maintain the same capabilities
```

## Part B — Subscriptions in one chat (ACP)

### How shipping products do it (verified 2026-10-12)

**Zed** and **JetBrains** host coding agents through the **Agent Client
Protocol**: each agent runs as its own process speaking JSON-RPC over stdio,
and "owns its own authentication and billing" (Zed docs). The client renders
what the agent streams — message chunks, tool calls, plans, permission
requests — and never sees a subscription token. It is also the only pattern
inside every vendor's current terms:

| Subscription | Agent (ACP) | Sign-in | Never do |
| --- | --- | --- | --- |
| Claude | unmodified Claude Code, via Zed's `claude-agent-acp` adapter | Claude Code's own flow | our own Claude.ai login; routing requests through subscription credentials (incl. the Agent SDK); storing tokens; Claude/Anthropic names or logos as our branding |
| Codex / ChatGPT | Codex CLI via `codex-acp` (or Codex `app-server`) | Codex's own ChatGPT login | a DevPulse-owned ChatGPT sign-in without OpenAI's "Sign in with ChatGPT" partner access |
| Gemini | Gemini CLI (native ACP) | Gemini CLI's own Google login, or API key / Vertex | using Gemini CLI's OAuth from any other tool (suspension) |
| Cursor | `agent acp` (official) | Cursor login or API key | — |

Sources: Claude Code legal & compliance (authentication and credential use;
"Can customers offer Claude Code in their products?"), OpenAI "Sign in with
ChatGPT" docs (plan usage is a waitlist for select commercial partners,
preview), Gemini CLI ToS page (OAuth piggybacking is a violation; unpaid and
Google One users moved to Antigravity CLI on 2026-06-18), Cursor CLI ACP
docs, agentclientprotocol.com (agents, protocol, session setup), Zed external
agents docs. Enforcement precedent: OpenCode's Claude OAuth cut off
Jan–Feb 2026; Google suspensions for Gemini CLI OAuth proxies.

### Design

- **Agent processes are runtimes.** Each agent CLI is an unmodified binary —
  the user's own install, or fetched from the ACP Registry on opt-in — run and
  supervised by plan 0007's kernel runtime adapter (pull, digest, Job Object,
  health). Nothing new to invent.
- **One chat.** One thread list; each thread picks an agent. Every agent
  streams the same ACP `session/update` kinds, so one renderer serves all four.
  Session updates are request-scoped streams → typed `Channel<T>` per thread
  (plan 0004 A9); thread ↔ session ids persist so `session/load` restores
  history.
- **Maximized subscriptions = shared context.** `session/new` takes
  `mcpServers`: every agent session gets DevPulse's own MCP server (the engine
  already ships one), exposing the developer profile, project knowledge and
  Knowledge Drops (plan 0004 C). Claude, Codex, Gemini and Cursor work from
  the same context.
- **Permission prompts teach.** `session/request_permission` becomes a UI
  intent; plan 0004's guidance explains what the agent wants to do, in plain
  language.
- **Auth stays with the agent.** DevPulse reads the agent's advertised auth
  methods (`initialize`), triggers `authenticate`, and shows the agent's own
  sign-in. No token ever enters DevPulse storage.

### Phases (each ≤5 files, verified live)

| # | Outcome | Live check |
| --- | --- | --- |
| B1 | Kernel ACP client on the official `agent-client-protocol` crate: initialize, authenticate, session new/load/prompt/cancel, updates, permission requests | tests against a scripted agent; one real prompt through Gemini CLI or Cursor on this machine |
| B2 | Agent catalog (`config/agents.default.toml`: id, command, ACP adapter, install source) + detection of installed agents and their sign-in state | this machine reports which of the four are installed and signed in |
| B3 | Agents run through plan 0007's runtime adapter; install from the ACP Registry with digest check | install → run → stop an agent from the UI; nothing left running after app exit |
| B4 | Engine facade + Tauri intents (start thread, prompt, cancel, answer permission); updates over typed `Channel<T>`; thread store in libSQL | prompt → streamed reply; restart app → `session/load` restores the thread |
| B5 | One chat UI: thread list, agent picker, renderer for message chunks / tool calls / plans / permission prompts | the same question to Claude, Codex, Gemini and Cursor in one window |
| B6 | DevPulse MCP server attached to every session (profile, project knowledge, Knowledge Drops) | each agent answers using DevPulse context it could only get from the MCP server |
| B7 | Onboarding "Connect your AI": detect, install, sign in through the agent's own flow, test prompt | first run connects one subscription end to end with no terminal |
| B8 | Owner checkpoint | owner sign-off |

## Non-goals

- Clyffy contextual help (plans 0004 / 0005).
- Preset system rebuild (plan 0006) — this plan consumes it.
- Building our own agents or reselling model usage — each user's own
  subscription or key is billed directly by its vendor.

## Part A — Endpoints and capabilities: phases

Approval between each; each ≤ 5 files except mechanical moves. UI-bound
updates ride the signal fabric (plan 0004 Part A), never new string events.

| # | Outcome | Verification |
| --- | --- | --- |
| 1 | `connectivity/` tiers + `probes/` (OpenAI-compatible and Anthropic; the probe must not mislabel an Anthropic 401 as OpenAI and must report every matching protocol) | Live: tier 1 against Ollama on this machine; tier 2 against a mesh peer (`100.x`) |
| 2 | `discovery/` ladder, ported + generalized, with signals | Live scan: every UI-bound event matches a logged probe |
| 3 | `capabilities/` manifests (brain, vision, voice-listening, voice-speaking, memory) + registry; kernel config write path | Manifest schema validation; config written to existing record, never a new one |
| 4 | `reconcile.rs` + `store.rs`: desired state, repair, update, remove, undo; resume. Local runtimes are installed and run by plan 0007's kernel runtime adapter | Kill mid-install, relaunch → resumes; undo restores previous config |
| 5 | `workflow.rs` + Tauri intents; state published as fabric signals | `cargo check -p devpulse_desktop_backend`; bindings regenerated at debug startup |
| 6 | Frontend `onboarding/`: first run = connect the Brain (Part B7) + point at projects / GitHub (plan 0004 C7); scan UI, tooltips, layman copy (07 R2–R6) | Live; text scan finds no jargon from UX spec §1 |
| 7 | Model Loader maintains every capability (Brain, Vision, Voice, Memory); advanced view behind flag | Live: change a capability → same card updates, no new card |
| 8 | Owner checkpoint (07 R7) | Owner sign-off |

## Decisions needed

1. **Tiers** — read as: tier 1 = direct HTTPS; tier 2 = private network
   (WireGuard, Tailscale/Headscale mesh, VPN), preferred when present. Correct?
2. **Kernel `interactions`** — the kernel module that defines the Setup Wizard
   as an interaction template: move its onboarding parts into this boundary
   (proposed) or keep it as Clyffy's scripted copy only?
3. **Frontend layout** — Nx library types in code vs `Desktop.md`
   `contracts / state / services / features` (still open).
4. **Anthropic Commercial Terms** — running Claude Code inside a product
   requires accepting them (owner action, before shipping B3).
5. **Claude adapter** — Zed's `claude-agent-acp` is built on the Agent SDK,
   whose terms bar subscription login without Anthropic's approval, while the
   compliance page allows users signing in to the unmodified Claude Code binary
   a platform hosts. Confirm the adapter route with Anthropic (contact sales),
   or drive Claude Code's own headless mode instead. Recommended: confirm
   before B3.
6. **OpenAI "Sign in with ChatGPT"** — only needed if DevPulse ever owns the
   ChatGPT sign-in; the ACP route uses Codex's own login. Join the partner
   waitlist? (optional, owner action)
7. **Gemini for free-tier users** — they moved to Antigravity CLI on
   2026-06-18; its ACP support is unverified. Verify in B2.
8. **Grok** — named on 2026-10-12 but no ACP agent was verified; until one
   is, Grok is a network endpoint (xAI API key) in Part A.

## Verification

Recorded per phase in the log.

## Log

- 2026-10-10 — Rewritten on the owner's UX requirements (restored from the
  June 30 recovery) and the 07 spec. Onboarding is the engine boundary;
  everything is an endpoint; tier 1 HTTPS → tier 2 private network.
- 2026-10-12 — Extended (owner direction): Part B, the user's subscriptions in
  one chat over ACP, grounded in Zed / JetBrains and verified against each
  vendor's current terms; agent connections live in the kernel (`agents/`),
  using the official `agent-client-protocol` crate (3.3.0). Applied plan 0007's
  amendment (no `onboarding/runtimes/`; the kernel runtime adapter runs local
  runtimes and agent CLIs) and plan 0004's onboarding scope (first run =
  Brain + projects/GitHub; Vision/Voice/Memory offered later by guides).
