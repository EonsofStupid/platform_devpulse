# WardenClyffe — Claude Integration Plan (researched June 2026)

> Status: planning artifact. Researched against the June 2026 Claude/MCP ecosystem.
> Goal: integrate Claude (Desktop + Code) with Lovable + Supabase + the self-hosted
> Clyffy/RRD backend, packaged as Skills / Connectors / a Plugin in the *official*
> Anthropic structure. Pre-build — no code committed yet.

## 0. The shape of the goal

Claude is the build operator. WardenClyffe (flagship) + casual/community sites are
built via Lovable, backed by Supabase, with the **Clyffy/RRD** brain on the Blackwell
exposed as an MCP server. Everything we add must be one of Claude's three official
extension types so it slots into the unified Directory (`claude.ai/directory`).

## 1. Official extension surface (verified June 2026)

| Type | What it is | Distribution |
|---|---|---|
| **Skill** | A folder with `SKILL.md` (YAML metadata + instructions). *Progressive disclosure* — only the frontmatter loads until invoked. Open standard (`anthropics/skills`). | Directory / repo |
| **Connector** | Claude ↔ external service via an **MCP server**. One-click. | Directory; custom MCP URL |
| **Plugin** | Bundle of skills + slash commands + sub-agents + hooks + MCP servers. | Marketplace (`anthropics/claude-plugins-official` auto-available; community marketplace pinned to SHAs) |

Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents/agent-skills/overview), [equipping agents with skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), [discover-plugins](https://code.claude.com/docs/en/discover-plugins), [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official).

## 2. What's SUCCEEDING now — adopt or model these

**Ready-made, install immediately (cover ~80% of the build pipeline):**

| Item | Type | Why it wins |
|---|---|---|
| **Lovable** | Connector + Plugin | Build/iterate/deploy Lovable apps from Claude ([lovable.dev/mcp](https://lovable.dev/mcp), [docs](https://docs.lovable.dev/integrations/lovable-mcp-server)) |
| **Supabase** | Connector | SQL, schema, edge functions, branches — the shared backend ([official connector](https://supabase.com/blog/supabase-is-now-an-official-claude-connector)) |
| **rust-analyzer-lsp / typescript-lsp** | Plugin | Post-edit diagnostics + navigation; cited as #1 to install |
| **github** | Plugin | Zero-setup source control |
| **code-review** | Plugin | 4 review agents in parallel, posts issues ≥80 confidence |
| **Context7** | Plugin | Live, version-correct library docs into context (348k installs) |
| **Frontend Design** | Plugin | Frontend output quality (829k installs — #1 overall) |
| **Playwright / Figma** | Connector | Browser test automation; design ingest |

Install counts + lists: [composio top plugins](https://www.composio.dev/), [claude.com/plugins](https://claude.com/plugins), [best MCP servers 2026](https://uibakery.io/blog/best-mcp-servers).

**Why they succeed (design rules for OUR skills):** narrow scope + a load-bearing
`description` (progressive disclosure drives discovery); composability; zero-setup
pre-configured MCP; low per-turn context cost; verified/vendor-maintained trust.

## 3. TRENDING but EXPERIMENTAL — early-adopt selectively

| Item | Maturity (June 2026) | Relevance to WardenClyffe |
|---|---|---|
| **MCP Apps** (`ui://` interactive UI in-chat) | Early/preview (shipped Jan 2026, rides the still-RC Extensions framework) | How Clyffy tools render real UI inside Claude — target for the WardenClyffe console |
| **MCP Tasks** (durable async work) | Experimental → becoming an Extension in the 2026-07-28 RC (breaking) | Long-running RRD jobs (indexing, training) as first-class tasks |
| **2026-07-28 spec** (stateless core, auth hardening) | Release Candidate | Build Clyffy's MCP server stateless-ready so it scales behind a LB |
| **Managed Agents / sub-agents / multi-agent orchestration** | Public beta | Specialist build agents (ColdLight, backend, content) under a lead |
| **Outcomes** (rubric success criteria) | Public beta | Encode "done = compiles + design-locks pass" as a rubric |
| **Dreaming** (between-session memory consolidation) | Research preview | **You already built this** — see §4 |
| **MCP Registry** | Preview (not GA) | Publish Clyffy's `server.json` when GA |

Sources: [MCP Apps](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/), [2026-07-28 RC](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/), [Managed Agents / Dreaming / Outcomes](https://thenewstack.io/anthropic-managed-agents-dreaming-outcomes/), [registry preview](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/).

## 4. YOUR history → WardenClyffe skills (the differentiated IP)

Mined from this repo's `.claude/` + our session. You have invented patterns the
ecosystem is only now formalizing — these become the WardenClyffe plugin's spine:

| Your asset (today) | What it does | Productize as | Official analog |
|---|---|---|---|
| `restore-memory.js` + SurrealDB `learnings`/`blockers`/`context` tables | Cross-session memory + "DO NOT REPEAT" mistake ledger restored at SessionStart | **Memory/Dreaming Skill** (persistent learnings, anti-regression) | *Dreaming* (research preview) — you're ahead |
| `psych-translator.js` (CC-009) | Detects user frustration, strips it, injects "be direct, find root cause, no apology" | **Signal-routing Skill** | **No official equivalent** — genuine differentiator |
| `verify-on-stop.js` (CC-001) + CC-001…014 countermeasures | Forces verification before "done"; reliability catalog | **Reliability Skill + Outcomes rubric** | *Outcomes* (beta) |
| `coldlight-curator` agent | Zero-tolerance design-system enforcement | **ColdLight Skill** (every Lovable site auto-aligns) | model-able as a Skill |
| `strict-foundation-engineer` agent | Enterprise-grade code authoring | **Sub-agent** in the plugin | sub-agents (beta) |
| `lint-plan.js`, `save-state.js`, `track-files.js`, `banter-dump.js` | Plan QA, state persistence, file tracking, persona | Plugin **hooks** | hooks (GA) |

**Insight:** your `.claude/` directory is already a *de facto* plugin. The work is
re-packaging it in the official `Plugin` format + making `psych-translator` and the
memory ledger portable Skills — that's a publishable, differentiated product, not
just internal tooling.

## 5. Build plan (phased)

**Phase 0 — adopt (today, zero build):** add Lovable + Supabase + github +
rust-analyzer-lsp + code-review in Claude Desktop/Code. Immediate pipeline.

**Phase 1 — Clyffy MCP server (keystone):** Rust crate using the **official `rmcp`
SDK v1.7.0** (`modelcontextprotocol/rust-sdk`), **Streamable HTTP** transport,
**OAuth 2.1** (server = Resource Server, RFC 9728/8707, PKCE). Expose RRD as MCP
`tools` + `resources`. Wrap existing service with `#[tool_router]`/`#[tool]` — no
rewrite. Build stateless-ready for the 2026-07-28 RC. Add as a custom connector.

**Phase 2 — WardenClyffe Skills:** package `psych-translator` (signal routing),
the memory/learnings ledger, and ColdLight discipline as portable `SKILL.md` skills.

**Phase 3 — WardenClyffe Plugin:** bundle the Clyffy connector + the Phase-2 skills
+ slash commands (`scaffold-site`, `theme-swap` casual↔pro) + the
`strict-foundation-engineer` sub-agent + hooks. Publish to a private marketplace
mirroring `anthropics/claude-plugins-official` structure.

**Phase 4 — MCP Apps UI:** once Clyffy exposes tools, render the WardenClyffe console
via `ui://` resources + Elicitation for human-in-the-loop.

## 6. Watch / risks

- **MCP Apps + Tasks are pre-stable** — isolate behind our own interface; expect the
  2026-07-28 breaking migration. Don't hard-couple.
- **Registry is preview** — publish `server.json` but don't depend on it for discovery.
- **Rust SDK impostors** — only `modelcontextprotocol/rust-sdk` (`rmcp`) is official.
- **Auth: never token-passthrough** — Clyffy must validate token audience (RFC 8707)
  and mint its own upstream tokens.

---
*Spec revision targeted: MCP `2025-11-25` (stable), forward-compatible with the
`2026-07-28` RC. SDK: `rmcp` v1.7.0.*
